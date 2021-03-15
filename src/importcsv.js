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
  let id = 1;

  await rows.forEach((row) => {
    let genreArray = [];
    genreArray = row.genres.split(',');
    
    genreArray.forEach((gen) => {
      if (!genres.some(genre => genre.genre === gen)) {
        genres.push({"id": id, "genre": gen});    //býr til array of objects með id og genre
        id += 1;
      }
    });
    

  });
  console.log(genres);
  
  //genres sett inn í sína töflu
  const q = 'INSERT INTO genres (id, title) VALUES ($1, $2) RETURNING *';
  await genres.forEach((genre) => {
    const values = [
      genre.id,
      genre.genre,
    ];

    query(q, values);
  });
  
  //tengitaflan shows_genres búin til
  await rows.forEach((row) => {
    let genreArray = [];
    genreArray = row.genres.split(',');

    const qu = 'INSERT INTO shows_genres (show, genre) VALUES ($1, $2);';
    genreArray.forEach((gen) => {
      let found = genres.find(({genre}) => genre === gen);
      console.log(row.id);
      console.log(found);

        const values = [
          row.id,
          found.id,
        ];
       query(qu, values);
      
    });
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

  const image = 'res.cloudinary.com/dhartr5et/image/upload/v1614684283/vef2-2021-h1/' + row.image;

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
      (title, number, first_aired, description, poster, show)
    VALUES
      ($1, $2, $3, $4, $5, $6)`;

  const poster = 'res.cloudinary.com/dhartr5et/image/upload/v1614684283/vef2-2021-h1/' + row.poster;
  let date = null;
  if(row.airDate == "") date = null;
  else date = row.airDate;

  const values = [
    row.name,
    row.number,
    date,
    row.overview,
    poster,
    row.serieId,
  ];

  return query(q, values);
}

async function importEpisode(row) {
  const q = `
    INSERT INTO
      episodes
      (title, number, first_aired, description, season, show)
    VALUES
      ($1, $2, $3, $4, $5, $6)`;

  let date = null;
  if(row.airDate == "") date = null;
  else date = row.airDate;

  const values = [
    row.name,
    row.number,
    date,
    row.overview,
    row.season,
    row.serieId,
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
  console.info('Starting Series');
  const file = './data/series.csv';

  const rows = await parseFile(file);

  for (let i = 0; i < rows.length; i += 1) {
    await importShow(rows[i]);
  }

  await importGenres(rows);

  console.info('Finished Series');
}

async function importSeasons() {
  console.info('Starting Seasons');
  const file = './data/seasons.csv';

  const rows = await parseFile(file);

  for (let i = 0; i < rows.length; i += 1) {
    await importSeason(rows[i]);
  }
  console.info('Finished Seasons');
}

async function importEpisodes() {
  console.info('Starting Episodes');
  const file = './data/episodes.csv';

  const rows = await parseFile(file);

  for (let i = 0; i < rows.length; i += 1) {
    await importEpisode(rows[i]);
  }
  console.info('Finished Episodes');
}

await importSeries().catch((err) => {
  console.error('Error importing', err);
});

await importSeasons().catch((err) => {
  console.error('Error importing', err);
});

importEpisodes().catch((err) => {
  console.error('Error importing', err);
});