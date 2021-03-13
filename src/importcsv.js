/* eslint-disable no-await-in-loop */

import dotenv from 'dotenv';
import csv from 'csv-parser';
import fs from 'fs';
import { query } from './db.js';
//import neatCsv from 'neat-csv';
//import { parse } from 'path';

dotenv.config();

async function importGenres(rows) {
  let genres = [];

  // finna einstaka flokka
  rows.forEach((row) => {
    let genreArray = [];
    genreArray = row.genres.split(',');
    genreArray.forEach((genre) => {
      if (genres.indexOf(genre) < 0) {
        genres.push(genre);
      }
    });
  });

  // breyta hverjum einstökum flokk í insert fyrir þann flokk
  const q = 'INSERT INTO genres (title) VALUES ($1) RETURNING *';
  await genres.forEach((genre) => {
    query(q, [genre]);
  });


  /*const inserts = genres.map(c => query(q, [c]));

  // inserta öllu og bíða
  const results = await Promise.all(inserts);

  const mapped = {};

  // skila á forminu { NAFN: id, .. } svo það sé auðvelt að fletta upp
  results.forEach((r) => {
    const [{
      id,
      title,
    }] = r.rows;

    mapped[title] = id;
  });

  return mapped;*/
}

async function importShow(row) {
  const q = `
    INSERT INTO
      shows
      (title, first_aired, in_production, tagline, image, description, language, network, webpage)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

  const image = 'https://res.cloudinary.com/dhartr5et/image/upload/v1614684283/vef2-2021-h1/' + row.image;

  const values = [
    row.name,
    row.airDate,
    row.inProduction,
    row.tagline,
    image,
    row.description,
    row.language,
    row.network,
    row.homepage,
  ];

  return query(q, values);
}

async function importSeason(row) {
  const q = `
    INSERT INTO
      seasons
      (title, number, first_aired, description, poster)
    VALUES
      ($1, $2, $3, $4, $5)`;

  const poster = 'https://res.cloudinary.com/dhartr5et/image/upload/v1614684283/vef2-2021-h1/' + row.poster;
  let date = null;
  if(row.airDate == "") date = null;
  else date = row.airDate;

  const values = [
    row.name,
    row.number,
    date,
    row.overview,
    poster,
    //vísun í þátt
  ];

  return query(q, values);
}

async function importEpisode(row) {
  const q = `
    INSERT INTO
      episodes
      (title, number, first_aired, description)
    VALUES
      ($1, $2, $3, $4)`;

  let date = null;
  if(row.airDate == "") date = null;
  else date = row.airDate;

  const values = [
    row.name,
    row.number,
    date,
    row.overview,
    //vísun í season
  ];

  return query(q, values);
}

function parseFile(file) {
  let results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .on('error', error => {
        reject(error);
      })
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      });

    });
}

async function importSeries() {
  console.info('Starting import');
  const file = './data/series.csv';

  const rows = await parseFile(file);

  await importGenres(rows);

  for (let i = 0; i < rows.length; i += 1) {
    await importShow(rows[i]);
  }

  console.info('Finished!');
}

async function importSeasons() {
  const file = './data/seasons.csv';

  const rows = await parseFile(file);

  for (let i = 0; i < rows.length; i += 1) {
    await importSeason(rows[i]);
  }
  
}

async function importEpisodes() {
  const file = './data/episodes.csv';

  const rows = await parseFile(file);

  for (let i = 0; i < rows.length; i += 1) {
    await importEpisode(rows[i]);
  }
}

importSeries().catch((err) => {
  console.error('Error importing', err);
});

importSeasons().catch((err) => {
  console.error('Error importing', err);
});

importEpisodes().catch((err) => {
  console.error('Error importing', err);
});