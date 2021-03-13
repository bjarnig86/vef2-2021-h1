/* eslint-disable no-await-in-loop */

import dotenv from 'dotenv';
import csv from 'csv-parser';
import fs from 'fs';
import { query } from './db.js';
import neatCsv from 'neat-csv';
//import { parse } from 'path';

dotenv.config();

async function importGenres(rows) {
  let genres = [];
//console.log('annað' + rows);
  // finna einstaka flokka
  rows.forEach((row) => {
    let genreArray = [];
    genreArray = row.genres.split(',');
    //console.log(genreArray);
    genreArray.forEach((genre) => {
      if (genres.indexOf(genre) < 0) {
        genres.push(genre);
      }
    });
  });
  //console.log(genres);

  // breyta hverjum einstökum flokk í insert fyrir þann flokk
  const q = 'INSERT INTO genres (title) VALUES ($1) RETURNING *';
  await genres.forEach((genre) => {
    query(q, [genre]);
  });

  //query(q);

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
  //const date = '2021-01-15';
//console.log(row.airDate);

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

function parseFile(file) {
  console.log('parse-1');
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
        console.log('parse-2');
      });

    });
}

export async function importSeries() {
  console.info('Starting import');
  const file = './data/series.csv';

  const rows = await parseFile(file);

  await importGenres(rows);

  console.info('Categories created');

  for (let i = 0; i < rows.length; i += 1) {
    await importShow(rows[i]);
    //console.info(`Imported ${rows[i].title}`);
  }

  console.info('Finished!');
}

importSeries().catch((err) => {
  console.error('Error importing', err);
});
