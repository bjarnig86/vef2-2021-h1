import express from 'express';
import dotenv from 'dotenv';
import { body, param } from 'express-validator';
import xss from 'xss';
import { requireAuthentication } from './usercontrol.js';
import { query } from './db.js';
import { findByUserIdAndShowId } from './users.js';
import { catchErrors, validationCheck } from './utils.js';

dotenv.config();

export const router = express.Router();

const validateRate = [
  body('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Aðeins heiltölur á bilinu 1-5'),
];

const xssSanitizationRate = [param('rating').customSanitizer((v) => xss(v))];
const xssSanitizationState = [param('status').customSanitizer((v) => xss(v))];

/**
 * /tv/:id/rate POST,
 * skráir einkunn innskráðs notanda á sjónvarpsþætti, aðeins fyrir innskráða notendur
 */
router.post(
  '/tv/:id/rate',
  requireAuthentication,
  validateRate,
  xssSanitizationRate,
  catchErrors(validationCheck),
  async (req, res) => {
    const tvId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { rating } = req.body;

    if (!rating) {
      return res.status(400).json({ error: 'wrong input' });
    }

    const userQuery = await findByUserIdAndShowId(userId, tvId);

    const data = [tvId, userId, rating];
    if (!userQuery || userQuery === null) {
      const q = 'INSERT INTO users_shows (show, "user", rating) VALUES ($1, $2, $3)';
      const result = await query(q, data);
      return res.json(result);
    }

    if (userQuery.rating === null) {
      const q = 'UPDATE users_shows SET rating = $1 WHERE id = $2';
      const result = await query(q, [rating, userQuery.id]);
      return res.json(result);
    }
    return res.status(401).json({ error: 'Already posted rating' });
  },
);

/**
 * /tv/:id/rate PATCH,
 * uppfærir einkunn innskráðs notanda á sjónvarpsþætti
 */
router.patch(
  '/tv/:id/rate',
  requireAuthentication,
  validateRate,
  xssSanitizationRate,
  catchErrors(validationCheck),
  async (req, res) => {
    const tvId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { rating } = req.body;

    if (!rating) {
      return res.status(400).json({ error: 'wrong input' });
    }

    const userQuery = await findByUserIdAndShowId(userId, tvId);

    const data = [rating, userQuery.id];
    const q = 'UPDATE users_shows SET rating = $1 WHERE id = $2';

    const result = await query(q, data);
    return res.json(result);
  },
);

/**
 * /tv/:id/rate DELETE,
 * eyðir einkunn innskráðs notanda á sjónvarpsþætti
 */
router.delete('/tv/:id/rate', requireAuthentication, async (req, res) => {
  const tvId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  const userQuery = await findByUserIdAndShowId(userId, tvId);

  if (userQuery.rating === null) {
    return res.status(400).json({ message: 'No rating to delete' });
  }

  const data = [null, userQuery.id];
  const q = 'UPDATE users_shows SET rating = $1 WHERE id = $2';
  const result = await query(q, data);
  return res.json(result);
});

/**
 * /tv/:id/state POST,
 * skráir stöðu innskráðs notanda á sjónvarpsþætti,
 * aðeins fyrir innskráða notendur
 */

router.post(
  '/tv/:id/state',
  requireAuthentication,
  xssSanitizationState,
  catchErrors(validationCheck),
  async (req, res) => {
    const tvId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'wrong input' });
    }

    const userQuery = await findByUserIdAndShowId(userId, tvId);

    const data = [tvId, userId, status];

    if (!userQuery || userQuery === null) {
      const q = 'INSERT INTO users_shows (show, "user", status) VALUES ($1, $2, $3)';
      const result = await query(q, data);
      return res.json(result);
    }
    if (userQuery.status === null) {
      const q = 'UPDATE users_shows SET status = $1 WHERE id = $2';
      const result = await query(q, [status, userQuery.id]);
      return res.json(result);
    }
    return res.status(401).json({ error: 'Already posted status' });
  },
);

/**
 * /tv/:id/state PATCH,
 * uppfærir stöðu innskráðs notanda á sjónvarpsþætti
 */
router.patch(
  '/tv/:id/state',
  requireAuthentication,
  xssSanitizationState,
  catchErrors(validationCheck),
  async (req, res) => {
    const tvId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'wrong input' });
    }

    const userQuery = await findByUserIdAndShowId(userId, tvId);

    const data = [status, userQuery.id];
    const q = 'UPDATE users_shows SET status = $1 WHERE id = $2';

    const result = await query(q, data);
    return res.json(result);
  },
);

/**
 * /tv/:id/state DELETE,
 * eyðir stöðu innskráðs notanda á sjónvarpsþætti
 */
router.delete('/tv/:id/state', requireAuthentication, async (req, res) => {
  const tvId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  const userQuery = await findByUserIdAndShowId(userId, tvId);

  if (userQuery.status === null) {
    return res.status(400).json({ message: 'No status to delete' });
  }

  const data = [null, userQuery.id];
  const q = 'UPDATE users_shows SET status = $1 WHERE id = $2';
  const result = await query(q, data);
  return res.json(result);
});
