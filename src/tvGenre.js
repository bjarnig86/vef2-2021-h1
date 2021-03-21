import express from 'express';
import xss from 'xss';
import { body } from 'express-validator';
import { query } from './db.js';
import {
  validationMiddlewareId,
  validationMiddlewareParamSeason,
  xssSanitizationId,
  xssSanitizationParamSeason,
  validationCheck,
  catchErrors,
} from './utils.js';

import { requireAdminAuthentication } from './usercontrol.js';

export const router = express.Router();

router.use(express.json());

const xssSanitizationSeason = [
  body('title').customSanitizer((v) => xss(v)),
  body('number').customSanitizer((v) => xss(v)),
  body('first_aired').customSanitizer((v) => xss(v)),
  body('description').customSanitizer((v) => xss(v)),
  body('poster').customSanitizer((v) => xss(v)),
];

const validationMiddlewareSeason = [
  body('title')
    .isLength({ min: 1 })
    .withMessage('Titill þarf að vera amk 1 stafur'),
  body('title')
    .isLength({ max: 128 })
    .withMessage('Titill má að hámarki vera 128 stafir'),
  body('number').isNumeric().withMessage('Fjöldi þarf að vera tala'),
  body('first_aired')
    .isDate()
    .withMessage('Fyrst birt þarf að vera dagsetning'),
  body('description')
    .isLength({ max: 400 })
    .withMessage('Description má að hámarki vera 400 stafir'),
  body('poster')
    .isLength({ max: 255 })
    .withMessage('Mynd má að hámarki vera 255 stafir'),
  body('poster').isURL().withMessage('Mynd þarf að vera á URL formi'),
];

/**
 * skilar fylki af öllum seasons fyrir sjónvarpsþátt
 *
 * @name /tv/:id/season GET
 * @function
 * @param {*} req Beiðni
 * @param {*} res Svar
 */
router.get(
  '/tv/:id/season',
  validationMiddlewareId,
  xssSanitizationId,
  catchErrors(validationCheck),

  async (req, res) => {
    let { offset = 0, limit = 10 } = req.query;
    offset = Number(offset);
    limit = Number(limit);

    const q = `SELECT * FROM seasons
      WHERE show = $1
      ORDER BY number ASC
      OFFSET $2
      LIMIT $3`;

    const seasons = await query(q, [req.params.id, offset, limit]);

    const result = {
      limit,
      offset,
      items: seasons.rows,
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
    }

    if (seasons.rows.length === limit) {
      result.links.next = {
        href: `/?offset=${Number(offset) + limit}&limit=${limit}`,
      };
    }

    res.json(result);
  }
);

/**
 * /tv/:id/season POST
 * Býr til nýtt í season í sjónvarpþætti,
 * aðeins ef notandi er stjórnandi
 */
router.post(
  '/tv/:id/season',
  requireAdminAuthentication,
  validationMiddlewareId,
  validationMiddlewareSeason,
  xssSanitizationId,
  xssSanitizationSeason,
  catchErrors(validationCheck),

  async (req, res) => {
    // console.log(`tvRouting.js: /tv/:id/season post req.body --> ${req.body}`);
    const { title, number, first_aired, description, poster } = req.body;

    const seasonData = [
      title,
      number,
      first_aired,
      description,
      poster,
      req.params.id,
    ];

    // console.log(`tvRouting.js: /tv/:id/season post seasonData --> ${seasonData}`);

    const q = `INSERT INTO seasons (
      title,
      number,
      first_aired,
      description,
      poster,
      show)
      VALUES ($1,$2,$3,$4,$5,$6)`;

    const result = await query(q, seasonData);

    return res.json(result);
  }
);

/**
 * /tv/:id/season/:season GET
 * skilar stöku season fyrir þátt með grunnupplýsingum,
 * fylki af þáttum
 */
router.get(
  '/tv/:id/season/:season',
  validationMiddlewareId,
  validationMiddlewareParamSeason,
  xssSanitizationId,
  xssSanitizationParamSeason,
  catchErrors(validationCheck),

  async (req, res) => {
    let { offset = 0, limit = 10 } = req.query;
    offset = Number(offset);
    limit = Number(limit);

    const qSeason = `SELECT * FROM seasons
      WHERE show = $1 AND number = $2`;

    const season = await query(qSeason, [req.params.id, req.params.season]);

    const qEpisodes = `SELECT * FROM episodes
      WHERE show = $1 AND season = $2
      ORDER BY number ASC
      OFFSET $3
      LIMIT $4;`;

    const episodes = await query(qEpisodes, [
      req.params.id,
      req.params.season,
      offset,
      limit,
    ]);

    const result = {
      limit,
      offset,
      season: season.rows[0],
      items: episodes.rows,
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
    }

    if (episodes.rows.length === limit) {
      result.links.next = {
        href: `/?offset=${Number(offset) + limit}&limit=${limit}`,
      };
    }

    res.json(result);
  }
);

/**
 * /tv/:id/season/:season DELETE
 * eyðir season, aðeins ef notandi er stjórnandi
 */
router.delete(
  '/tv/:id/season/:season',
  requireAdminAuthentication,
  validationMiddlewareId,
  validationMiddlewareParamSeason,
  xssSanitizationId,
  xssSanitizationParamSeason,
  catchErrors(validationCheck),

  async (req, res) => {
    const result = await query(
      `DELETE FROM seasons WHERE show = ${req.params.id} AND number = ${req.params.season} `
    );
    return res.json(result);
  }
);
