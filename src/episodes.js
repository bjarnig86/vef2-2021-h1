import express from 'express';
import xss from 'xss';
import { body, validationResult } from 'express-validator';
import { query } from './db.js';

import { requireAdminAuthentication } from './usercontrol.js';

export const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

const validationEpisode = [
  body('title')
    .isLength({ max: 255 })
    .withMessage('Nafn þáttar má að hámarki vera 255 stafir'),
  body('number')
    .isLength({ max: 10 })
    .withMessage('Númer þáttar má að hámarki vera 10 stafa tala'),
  body('first_aired')
    .isDate('yyyy-mm-dd')
    .withMessage('Dagsetning þarf að vera á réttu formi (yyyy-mm-dd)'),
  body('description')
    .isLength({ max: 400 })
    .withMessage('Description má að hámarki vera 400 stafir'),
];

const xssSanitizationEpisode = [
  body('id').customSanitizer((v) => xss(v)),
  body('title').customSanitizer((v) => xss(v)),
  body('number').customSanitizer((v) => xss(v)),
  body('first_aired').customSanitizer((v) => xss(v)),
  body('description').customSanitizer((v) => xss(v)),
  body('season').customSanitizer((v) => xss(v)),
  body('show').customSanitizer((v) => xss(v)),
];

async function validationCheckEpisode(req, res, next) {
  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    return res.status(401).json({ errors: validation.errors });
  }

  return next();
}

/**
 * /tv/:id/season/:season/episode/ POST,
 * býr til nýjan þátt í season,
 * aðeins ef notandi er stjórnandi
 */
router.post(
  '/tv/:id/season/:season/episode/',
  requireAdminAuthentication,
  validationEpisode,
  xssSanitizationEpisode,
  catchErrors(validationCheckEpisode),
  async (req, res) => {
    const {
      title, number, first_aired, description,
    } = req.body;

    const { id, season } = req.params;

    const show = id;
    const episodeData = [title, number, first_aired, description, season, show];

    const q = `INSERT INTO episodes
    (title, number, first_aired, description, season, show)
    VALUES
    ($1, $2, $3, $4, $5, $6)
    RETURNING *;`;

    const result = await query(q, episodeData);

    return res.json(result);
  },
);

/**
 * /tv/:id/season/:season/episode/:episode GET,
 * Skilar  skilar upplýsingum um þátt
 */
router.get('/tv/:id/season/:season/episode/:episode', async (req, res) => {
  const q = `SELECT * FROM episodes
    WHERE show = $1 AND season = $2 AND number = $3;`;

  const episodes = await query(q, [
    req.params.id,
    req.params.season,
    req.params.episode,
  ]);

  if (episodes.rowCount === 0) {
    return res.status(404).json({ error: 'Episode not found' });
  }

  return res.json(episodes.rows[0]);
});

/**
 * Deletar episode (:episode) úr þáttaröð (:id) og season (:season)
 * Þarf að vera admin
 */
router.delete(
  '/tv/:id/season/:season/episode/:episode',
  requireAdminAuthentication,
  xssSanitizationEpisode,
  catchErrors(validationCheckEpisode),

  async (req, res) => {
    const { season, episode } = req.params;
    const show = req.params.id;

    const result = await query(`DELETE FROM episodes WHERE 
      show = ${show} AND 
      season = ${season} AND 
      number = ${episode}
      RETURNING *;`);

    res.json(result);
  },
);
