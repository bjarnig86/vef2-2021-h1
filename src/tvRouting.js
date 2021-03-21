// import { join, dirname } from 'path';
// import { fileURLToPath } from 'url';

import express from 'express';
import dotenv from 'dotenv';
import xss from 'xss';
import { body, param, validationResult } from 'express-validator';
import { query } from './db.js';
import { validationCheck } from './utils.js';
import { withMulter, createImageURL } from './image.js';

import {
  isLoggedIn, //ekkert notað??
  requireAdminAuthentication,
  requireAuthentication,
} from './usercontrol.js';

import { findByUserIdAndShowId } from './users.js';

dotenv.config();

const { BASE_URL: baseUrl } = process.env;

export const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

function isEmpty(s) {
  if (typeof s === 'undefined') return true;
  return s != null && !s;
}

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/**
 * /tv - GET
 * skilar síðum af sjónvarpsþáttum
 * með grunnupplýsingum,
 * fylki af flokkum,
 * fylki af seasons,
 * meðal einkunn sjónvarpsþáttar,
 * fjölda einkunna sem hafa verið skráðar fyrir sjónvarpsþátt
 */
router.get('/tv', async (req, res) => {
  let { offset = 0, limit = 10 } = req.query;
  offset = Number(offset);
  limit = Number(limit);

  const allShows = await query(
    'SELECT * FROM shows ORDER BY id ASC OFFSET $1 LIMIT $2',
    [offset, limit],
  );

  const { path } = req;

  const result = {
    limit,
    offset,
    items: allShows.rows,
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

  if (allShows.rows.length === limit) {
    result.links.next = {
      href: `${baseUrl}${path}?offset=${Number(offset) + limit}&limit=${limit}`,
    };
  }

  res.json(result);
});

/**
 * validerar post gögn frá /tv
 * @param {*} param0
 */
async function validationMiddlewareTVShow({
  title,
  tagline,
  language,
  network,
  webpage,
} = {}) {
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
  if (!isEmpty(tagline) && tagline.length > 255) {
    validation.push({
      field: 'tagline',
      error: 'Tagline má að hámarki vera 255 stafir',
    });
  }
  if (isEmpty(language) || language.length !== 2) {
    validation.push({
      field: 'language',
      error:
        'Language þarf að vera til staðar og er táknað með tveimur bókstöfum',
    });
  }
  if (!isEmpty(network) && network.length > 255) {
    validation.push({
      field: 'network',
      error: 'Network má að hámarki vera 255 stafir',
    });
  }
  if (!isEmpty(webpage) && webpage.length > 255) {
    validation.push({
      field: 'webpage',
      error: 'Webpage má að hámarki vera 255 stafir',
    });
  }
  return validation;
} //held það megi taka þetta út

/*const validationMiddlewareTVShowPatch = [
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
  param('id').isNumeric().withMessage('id þarf að vera tala'),
];*/ const validationMiddlewareId = [
  param('id').isNumeric().withMessage('id þarf að vera tala'),
]; //held það megi taka þetta út

/*const xssSanitizationTVShow = [
  body('title').customSanitizer((v) => xss(v)),
  body('first_aired').customSanitizer((v) => xss(v)),
  body('in_production').customSanitizer((v) => xss(v)),
  body('tagline').customSanitizer((v) => xss(v)),
  body('image').customSanitizer((v) => xss(v)),
  body('description').customSanitizer((v) => xss(v)),
  body('language').customSanitizer((v) => xss(v)),
  body('network').customSanitizer((v) => xss(v)),
  body('webpage').customSanitizer((v) => xss(v)),
  body('id').customSanitizer((v) => xss(v)),
];*/ const xssSanitizationId = [
  param('id').customSanitizer((v) => xss(v)),
];

async function validationCheckTVShow(req, res, next) {
  const validation = validationResult(req);
  //   console.log('validation :>> ', validation);

  if (!validation.isEmpty()) {
    return res.json({ errors: validation.errors });
  }

  return next();
}
/**
 * /tv POST
 * býr til nýjan sjónvarpsþátt, aðeins ef notandi er stjórnandi
 */
router.post(
  '/tv',
  requireAdminAuthentication,

  async (req, res, next) => {
    await withMulter(req, res, next);
    const {
      title,
      first_aired,
      in_production,
      tagline,
      description,
      language,
      network,
      webpage,
    } = req.body;

    const val = {
      title,
      tagline,
      language,
      network,
      webpage,
    };

    const validations = await validationMiddlewareTVShow(val);
    catchErrors(validationCheckTVShow);
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

    const showData = [
      isset(title) ? xss(title) : null,
      isset(first_aired) ? xss(first_aired) : null,
      isset(in_production) ? xss(in_production) : null,
      isset(tagline) ? xss(tagline) : null,
      image,
      isset(description) ? xss(description) : null,
      isset(language) ? xss(language) : null,
      isset(network) ? xss(network) : null,
      isset(webpage) ? xss(webpage) : null,
    ];

    const q = `INSERT INTO shows 
  (title, first_aired, in_production, tagline, image, description, language, network, webpage) 
  VALUES
  ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;

    const result = await query(q, showData);

    return res.json(result);
  },
);

/**
 * /tv/:id GET skilar
 * stöku sjónvarpsþáttum með grunnupplýsingum,
 * meðal einkunn sjónvarpsþáttar,
 * fjölda einkunna sem hafa verið skráðar fyrir sjónvarpsþátt,
 * fylki af tegundum sjónvarpsþáttar(genres),
 * fylki af seasons,
 * rating notanda,
 * staða notanda
 */
router.get('/tv/:id', isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  const qShow = 'SELECT * FROM shows WHERE id = $1;';
  const show = await query(qShow, [id]);
  const showData = show.rows[0];

  const getUserShow = 'SELECT * FROM users_shows WHERE show = $1';
  const userShow = await query(getUserShow, [id]);

  let ratings = 0;
  userShow.rows.forEach((row) => {
    ratings += parseInt(row.rating, 10);
  });

  const avgRating = ratings / userShow.rowCount;

  const getGenres =
    'SELECT json_agg(genres.title) FROM genres INNER JOIN shows_genres ON genres.id = shows_genres.genre INNER JOIN shows ON shows.id = shows_genres.show WHERE shows.id = $1;';
  const showGenres = await query(getGenres, [id]);
  const arrayGenres = showGenres.rows[0].json_agg;

  const allGenres = [];
  arrayGenres.forEach((genre) => {
    allGenres.push({ name: genre });
  });

  const getSeasons = 'SELECT * FROM seasons WHERE show = $1;';
  const showSeasons = await query(getSeasons, [id]);

  if (user) {
    const userShowRateState = await findByUserIdAndShowId(user.id, id);
    const userRating = userShowRateState ? userShowRateState.rating : null;
    const userStatus = userShowRateState ? userShowRateState.status : null;

    const result = {
      id: showData.id,
      title: showData.title,
      first_aired: showData.first_aired,
      in_production: showData.in_production,
      tagline: showData.tagline,
      image: showData.image,
      description: showData.description,
      language: showData.language,
      network: showData.network,
      webpage: showData.webpage,
      averageRating: avgRating,
      ratingCount: userShow.rowCount,
      userRating,
      userStatus,
      genres: allGenres,
      seasons: showSeasons.rows,
    };

    return res.json(result);
  }

  const result = {
    id: showData.id,
    title: showData.title,
    first_aired: showData.first_aired,
    in_production: showData.in_production,
    tagline: showData.tagline,
    image: showData.image,
    description: showData.description,
    language: showData.language,
    network: showData.network,
    webpage: showData.webpage,
    averageRating: avgRating,
    ratingCount: userShow.rowCount,
    genres: allGenres,
    seasons: showSeasons.rows,
  };

  return res.json(result);
});

/**
 * /tv/:id PATCH,
 * uppfærir sjónvarpsþátt, reit fyrir reit, aðeins ef notandi er stjórnandi
 */
router.patch(
  '/tv/:id',
  requireAdminAuthentication,
  validationMiddlewareId,
  //validationMiddlewareTVShowPatch,
  //xssSanitizationTVShow,
  //catchErrors(validationCheckTVShow),

  async (req, res, next) => {
    await withMulter(req, res, next);
    const {
      title,
      first_aired,
      in_production,
      tagline,
      description,
      language,
      network,
      webpage,
    } = req.body;

    const { id } = req.params;
    const val = { title, tagline, language, network, webpage };

    const validations = await validationMiddlewareTVShow(val);
    catchErrors(validationCheckTVShow);
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

    const showData = [
      isset(title) ? xss(title) : null,
      isset(first_aired) ? xss(first_aired) : null,
      isset(in_production) ? xss(in_production) : null,
      isset(tagline) ? xss(tagline) : null,
      image,
      isset(description) ? xss(description) : null,
      isset(language) ? xss(language) : null,
      isset(network) ? xss(network) : null,
      isset(webpage) ? xss(webpage) : null,
      id,
    ];

    const q = `UPDATE shows
      SET 
        title = $1,
        first_aired = $2,
        in_production = $3,
        tagline = $4,
        image = $5,
        description = $6,
        language = $7,
        network = $8,
        webpage = $9
      WHERE id = $10
      RETURNING *`;

    const result = await query(q, showData);

    return res.json(result.rows[0]);
  },
);

/**
 * /tv/:id DELETE,
 * eyðir sjónvarpsþátt,
 * aðeins ef notandi er stjórnandi
 */
router.delete(
  '/tv/:id',
  requireAdminAuthentication,
  validationMiddlewareId, //er ekki allt þetta validation/sanitization óþarfi í delete?
  xssSanitizationId,
  catchErrors(validationCheck),

  async (req, res) => {
    const result = await query(`DELETE FROM shows WHERE id = ${req.params.id}`);
    return res.json(result);
  },
);
