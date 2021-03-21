/* eslint-disable no-await-in-loop */

import dotenv from 'dotenv';
import csv from 'csv-parser';
import fs from 'fs';
import { query } from './db.js';

dotenv.config();

/**
 * Býr til genres og shows_genres töflurnar með því að sækja upplýsingar úr series.csv skjalinu
 * @param {*} rows
 */
async function importGenres(rows) {
  const genres = [];
  let id = 1;

  await rows.forEach((row) => {
    let genreArray = [];
    genreArray = row.genres.split(',');

    genreArray.forEach((gen) => {
      if (!genres.some((genre) => genre.genre === gen)) {
        genres.push({ id, genre: gen }); // býr til array of objects með id og genre
        id += 1;
      }
    });
  });

  // genres sett inn í sína töflu
  const q = 'INSERT INTO genres (title) VALUES ($1) RETURNING *';
  await genres.forEach((genre) => {
    const values = [genre.genre];

    query(q, values);
  });

  // tengitaflan shows_genres búin til
  await rows.forEach((row) => {
    let genreArray = [];
    genreArray = row.genres.split(',');

    const qu = 'INSERT INTO shows_genres (show, genre) VALUES ($1, $2);';
    genreArray.forEach((gen) => {
      const found = genres.find(({ genre }) => genre === gen);
      console.info(found);

      const values = [row.id, found.id];
      query(qu, values);
    });
  });
}

/**
 * Býr til einn þátt í gagnagrunninum
 * @param {*} row
 */
async function importShow(row) {
  const q = `
    INSERT INTO
      shows
      (title, first_aired, in_production, tagline, image, description, language, network, webpage)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

  const image = `https://res.cloudinary.com/dhartr5et/image/upload/v1614684283/vef2-2021-h1/${row.image}`;

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

/**
 * Býr til eitt season í gagnagrunninum
 * @param {*} row
 */
async function importSeason(row) {
  const q = `
    INSERT INTO
      seasons
      (title, number, first_aired, description, image, show)
    VALUES
      ($1, $2, $3, $4, $5, $6)`;

  const image = `https://res.cloudinary.com/dhartr5et/image/upload/v1614684283/vef2-2021-h1/${row.poster}`;
  let date = null;
  if (row.airDate === '') date = null;
  else date = row.airDate;

  const values = [row.name, row.number, date, row.overview, image, row.serieId];

  return query(q, values);
}

/**
 * Býr til einn þátt í gagnagrunnninum
 * @param {*} row
 */
async function importEpisode(row) {
  const q = `
    INSERT INTO
      episodes
      (title, number, first_aired, description, season, show)
    VALUES
      ($1, $2, $3, $4, $5, $6)`;

  let date = null;
  if (row.airDate === '') date = null;
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

/**
 * Hjálparfall sem parse-ar .csv skrá
 * @param {*} file
 */
function parseFile(file) {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .on('error', (error) => {
        reject(error);
      })
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      });
  });
}

/**
 * Fall sem sækir gögn úr series skjalinu og sendir
 * áfram í tvö önnur föll
 */
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

/**
 * Fall sem sækir gögn úr seasons skjalinu og sendir
 * áfram í annað fall
 */
async function importSeasons() {
  console.info('Starting Seasons');
  const file = './data/seasons.csv';

  const rows = await parseFile(file);

  for (let i = 0; i < rows.length; i += 1) {
    await importSeason(rows[i]);
  }
  console.info('Finished Seasons');
}

/**
 * Fall sem sækir gögn úr episodes skjalinu og sendir
 * áfram í annað fall
 */
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

await importEpisodes().catch((err) => {
  console.error('Error importing', err);
});


/**
 * Keyrir inn rate og state á user bjarniCool
 */

async function insertRateAndState() {
  const q1 = `INSERT INTO users_shows (show, "user", rating, status) VALUES (1, 2, 3, 'Er að horfa')`
  const q2 = `INSERT INTO users_shows (show, "user", rating, status) VALUES (2, 2, 4, 'Langar að horfa')`
  const q3 = `INSERT INTO users_shows (show, "user", rating, status) VALUES (1, 2, 3, 'Hef horft')`
  query(q1);
  query(q2);
  query(q3);
  console.info('Finished Insert Rate & State');
}

await insertRateAndState().catch((err) => {
  console.error('Error importing', err);
});
