// import { join, dirname } from 'path';
// import { fileURLToPath } from 'url';

import express from 'express';
import dotenv from 'dotenv';
import xss from 'xss';
import { body, validationResult } from 'express-validator';
import { query } from './db.js';

import {
  requireAdminAuthentication,
  requireAuthentication,
} from './usercontrol.js';

export const router = express.Router();

router.use(express.json());

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/* get á /tv - `GET` skilar síðum af sjónvarpsþáttum með grunnupplýsingum, 
fylki af flokkum, fylki af seasons, meðal einkunn sjónvarpsþáttar, 
fjölda einkunna sem hafa verið skráðar fyrir sjónvarpsþátt */

router.get('/tv', async (req, res, next) => {
  let { offset = 0, limit = 10 } = req.query;
  offset = Number(offset);
  limit = Number(limit);

  const allShows = await query(
    'SELECT * FROM shows ORDER BY id ASC OFFSET $1 LIMIT $2',
    [offset, limit],
  );

  const result = {
    limit,
    offset,
    items: allShows.rows,
    links: {
      self: {
        href: `/?offset=${offset}&limit=${limit}`,
      },
    },
  };

  if (offset > 0) {
    result.links.prev = {
      href: `/?offset=${offset - limit}&limit=${limit}`,
    };
  } else {
    result.links.prev = { href: '' };
  }

  if (allShows.rows.length <= limit) {
    result.links.next = {
      href: `/?offset=${Number(offset) + limit}&limit=${limit}`,
    };
  }

  res.json(result);
});

const validationMiddlewareTVShow = [
  body('title')
    .isLength({ min: 1 })
    .withMessage('Titill þarf að vera amk 1 stafur'),
  body('title')
    .isLength({ max: 128 })
    .withMessage('Titill má að hámarki vera 128 stafir'),
  body('tagline')
    .isLength({ max: 128 })
    .withMessage('Tagline má að hámarki vera 128 stafir'),
  body('description')
    .isLength({ max: 400 })
    .withMessage('Description má að hámarki vera 400 stafir'),
  body('language')
    .isLength({ max: 2 })
    .withMessage('Language er táknað með tveimur bókstöfum'),
  body('network')
    .isLength({ max: 40 })
    .withMessage('Network má að hámarki vera 40 stafir'),
  body('webpage')
    .isLength({ max: 255 })
    .withMessage('Webpage má að hámarki vera 255 stafir'),
  body('webpage').isURL().withMessage('Webpage þarf að vera á URL formi'),
];

const xssSanitizationTVShow = [
  body('title').customSanitizer((v) => xss(v)),
  body('first_aired').customSanitizer((v) => xss(v)),
  body('in_production').customSanitizer((v) => xss(v)),
  body('tagline').customSanitizer((v) => xss(v)),
  body('image').customSanitizer((v) => xss(v)),
  body('description').customSanitizer((v) => xss(v)),
  body('language').customSanitizer((v) => xss(v)),
  body('network').customSanitizer((v) => xss(v)),
  body('webpage').customSanitizer((v) => xss(v)),
];

async function validationCheckTVShow(req, res, next) {
  const validation = validationResult(req);
  //   console.log('validation :>> ', validation);

  if (!validation.isEmpty()) {
    return res.json({ errors: validation.errors });
  }

  next();
}

router.post(
  '/tv',
  requireAdminAuthentication,
  validationMiddlewareTVShow,
  xssSanitizationTVShow,
  catchErrors(validationCheckTVShow),

  async (req, res) => {
    const {
      title,
      first_aired,
      in_production,
      tagline,
      image,
      description,
      language,
      network,
      webpage,
    } = req.body;

    const showData = [
      title,
      first_aired,
      in_production,
      tagline,
      image,
      description,
      language,
      network,
      webpage,
    ];

    const q = `INSERT INTO shows 
  (title, first_aired, in_production, tagline, image, description, language, network, webpage) 
  VALUES
  ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

    const result = await query(q, showData);

    return res.json(result);
  },
);
