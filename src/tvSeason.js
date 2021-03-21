/* eslint-disable object-curly-newline */
/* eslint-disable camelcase */
import express from 'express';
import dotenv from 'dotenv';
import xss from 'xss';
import { query } from './db.js';
import {
  validationMiddlewareId,
  validationMiddlewareParamSeason,
  xssSanitizationId,
  xssSanitizationParamSeason,
  validationCheck,
  catchErrors,
} from './utils.js';
import { withMulter, createImageURL } from './image.js';

import { requireAdminAuthentication } from './usercontrol.js';

export const router = express.Router();

router.use(express.json());

dotenv.config();

const { BASE_URL: baseUrl } = process.env;

function isEmpty(s) {
  if (typeof s === 'undefined') return true;
  return s != null && !s;
}

function isPosInt(i) {
  return i > 0 && i !== '' && Number.isInteger(Number(i));
}

async function validationMiddlewareSeason({ title, number } = {}) {
  const validation = [];

  if (isEmpty(title) || title.length < 1) {
    validation.push({
      field: 'title',
      error: 'Titill þarf að vera amk 1 stafur',
    });
  }
  if (!isEmpty(title) && title.length > 255) {
    validation.push({
      field: 'title',
      error: 'Titill má að hámarki vera 255 stafir',
    });
  }

  if (isEmpty(number) || !isPosInt(number)) {
    validation.push({
      field: 'number',
      error: 'Number þarf að vera til staðar og verður að vera jákvæð heiltala',
    });
  }

  return validation;
}

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

    const { path } = req;

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
          href: `${baseUrl}${path}?offset=${offset}&limit=${limit}`,
        },
      },
    };

    if (offset > 0) {
      result.links.prev = {
        href: `${baseUrl}${path}?offset=${offset - limit}&limit=${limit}`,
      };
    }

    if (seasons.rows.length === limit) {
      result.links.next = {
        href: `${baseUrl}${path}?offset=${
          Number(offset) + limit
        }&limit=${limit}`,
      };
    }

    res.json(result);
  },
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
  // validationMiddlewareSeason,
  xssSanitizationId,
  // xssSanitizationSeason,
  // catchErrors(validationCheck),

  async (req, res, next) => {
    // console.log(`tvRouting.js: /tv/:id/season post req.body --> ${req.body}`);
    await withMulter(req, res, next);

    const { title, number, first_aired, description } = req.body;
    const val = { title, number };

    const validations = await validationMiddlewareSeason(val);
    catchErrors(validationCheck);
    if (validations.length > 0) {
      return res.status(400).json({
        errors: validations,
      });
    }

    const [image, valid] = await createImageURL(req, res, next);
    if (valid.length > 0) {
      return res.status(400).json({
        errors: valid,
      });
    }
    const isset = (f) => typeof f === 'string' || typeof f === 'number';
    const seasonData = [
      isset(title) ? xss(title) : null,
      isset(number) ? xss(number) : null,
      isset(first_aired) ? xss(first_aired) : null,
      isset(description) ? xss(description) : null,
      image,
      req.params.id,
    ];

    // console.log(`tvRouting.js: /tv/:id/season post seasonData --> ${seasonData}`);

    const q = `INSERT INTO seasons (
      title,
      number,
      first_aired,
      description,
      image,
      show)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;

    const result = await query(q, seasonData);

    return res.json(result);
  },
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

    const { path } = req;

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
          href: `${baseUrl}${path}?offset=${offset}&limit=${limit}`,
        },
      },
    };

    if (offset > 0) {
      result.links.prev = {
        href: `${baseUrl}${path}?offset=${offset - limit}&limit=${limit}`,
      };
    }

    if (episodes.rows.length === limit) {
      result.links.next = {
        href: `${baseUrl}${path}?offset=${
          Number(offset) + limit
        }&limit=${limit}`,
      };
    }

    res.json(result);
  },
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
      `DELETE FROM seasons WHERE show = ${req.params.id} AND number = ${req.params.season} `,
    );
    return res.json(result);
  },
);
