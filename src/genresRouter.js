import express from 'express';
import dotenv from 'dotenv';
import { query } from './db.js';
import { body } from 'express-validator';
import xss from 'xss';

import { requireAdminAuthentication } from './usercontrol.js';
import { catchErrors, validationCheck } from './utils.js';

dotenv.config();

const { BASE_URL: baseUrl } = process.env;

export const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const genreValidation = [
  body('title').isLength({ min: 1 }).withMessage('Titill má ekki vera tómur'),
  body('title')
    .isLength({ max: 48 })
    .withMessage('Titill má ekki vera lengri en 48 stafir'),
];

const xssGenreSanitazion = [body('title').customSanitizer((v) => xss(v))];

/**
 * /genres GET,
 * skilar síðu af tegundum (genres)
 */
router.get('/genres', async (req, res) => {
  let { offset = 0, limit = 10 } = req.query;
  offset = Number(offset);
  limit = Number(limit);

  const { path } = req;

  const q = `SELECT * FROM genres
      ORDER BY id ASC OFFSET $1 LIMIT $2;`;

  const genres = await query(q, [offset, limit]);
  const titles = [];

  genres.rows.map((row) => titles.push({ name: row.title }));

  const result = {
    limit,
    offset,
    items: titles,
    links: {
      self: {
        href: `${baseUrl}${path}?offset=${offset}&limit=${limit}`,
      },
    },
  };

  if (offset > 0) {
    result.links.prev = {
      href: `${baseUrl}${path}?offset=${offset - limit}&limit=${limit}`,
    };
  } else {
    result.links.prev = { href: '' };
  }

  if (genres.rows.length === limit) {
    result.links.next = {
      href: `${baseUrl}${path}?offset=${Number(offset) + limit}&limit=${limit}`,
    };
  }

  res.json(result);
});

/**
 * /genres POST,
 * býr til tegund,
 * aðeins ef notandi er stjórnandi
 */
router.post(
  '/genres',
  requireAdminAuthentication,
  genreValidation,
  xssGenreSanitazion,
  catchErrors(validationCheck),
  async (req, res) => {
    const { title } = req.body;

    const q = 'INSERT INTO genres (title) VALUES ($1)';

    const result = await query(q, [title]);

    return res.json(result);
  }
);
