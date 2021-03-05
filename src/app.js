import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const {
  PORT: port = 3000,
  SESSION_SECRET: sessionSecret,
  DATABASE_URL: connectionString,
} = process.env;

if (!connectionString || !sessionSecret) {
  console.error('Vantar gögn í env --- app.js');
  process.exit(1);
}

const app = express();

// TODO klára uppsetningu á appi
// Sér um að req.body innihaldi gögn úr formi
app.use(express.urlencoded({ extended: true }));

const path = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(path, '../public')));

app.set('views', join(path, '../views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
    <html lang="is">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Test</title>
      </head>
      <body>
        <h1>Hér er verkefnið okkar!</h1>
        <h3>Einar</h3>
        <h3>Halli</h3>
        <h3>Áslaug</h3>
        <h3>Bjarni</h3>
      </body>
    </html>`);
});

/**
 * Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
 *
 * @param {string} field Middleware sem grípa á villur fyrir
 * @param {array} errors Fylki af villum frá express-validator pakkanum
 * @returns {boolean} `true` ef `field` er í `errors`, `false` annars
 */
function isInvalid(field, errors = []) {
  // Boolean skilar `true` ef gildi er truthy (eitthvað fannst)
  // eða `false` ef gildi er falsy (ekkert fannst: null)
  return Boolean(errors.find((i) => i && i.param === field));
}

app.locals.isInvalid = isInvalid;

// /**
//  * Middleware sem sér um 404 villur.
//  *
//  * @param {object} req Request hlutur
//  * @param {object} res Response hlutur
//  * @param {function} next Næsta middleware
//  */
// // eslint-disable-next-line no-unused-vars
// function notFoundHandler(req, res, next) {
//   const title = 'Síða fannst ekki';
//   res.status(404).render('error', { title });
// }

// /**
//  * Middleware sem sér um villumeðhöndlun.
//  *
//  * @param {object} err Villa sem kom upp
//  * @param {object} req Request hlutur
//  * @param {object} res Response hlutur
//  * @param {function} next Næsta middleware
//  */
// // eslint-disable-next-line no-unused-vars
// function errorHandler(err, req, res, next) {
//   console.error(err);
//   const title = 'Villa kom upp';
//   res.status(500).render('error', { title });
// }

// app.use(notFoundHandler);
// app.use(errorHandler);

// Verðum að setja bara *port* svo virki á heroku
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
