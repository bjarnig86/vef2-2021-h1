import express from 'express';
import dotenv from 'dotenv';
import xss from 'xss';
import {
  isLoggedIn,
  requireAdminAuthentication,
  requireAuthentication,
} from './usercontrol.js';
import { query } from './db.js';
import { findByUserIdAndShowId } from './users.js';

dotenv.config();

export const router = express.Router();

router.post('/tv/:id/rate', requireAuthentication, async (req, res) => {
  const tvId = parseInt(req.params.id, 10);
  const userId = req.user.id;
  const rating = req.body.rating;

  if (!rating) {
    return res.status(400).json({ error: 'wrong input' });
  }

  console.log('BJARNI --> ', rating);

  const userQuery = await findByUserIdAndShowId(userId, tvId);

  const data = [tvId, userId, rating];
  if (!userQuery || userQuery === null) {
    const q = `INSERT INTO users_shows (show, "user", rating) VALUES ($1, $2, $3)`;
    const result = await query(q, data);
    return res.json(result);
  }

  if (userQuery.rating === null) {
    const q = `UPDATE users_shows SET rating = $1 WHERE id = $2`;
    const result = await query(q, [rating, userQuery.id]);
    return res.json(result);
  } else {
    return res.status(401).json({ error: 'Already posted rating' });
  }
});

router.patch('/tv/:id/rate', requireAuthentication, async (req, res) => {
  const tvId = parseInt(req.params.id, 10);
  const userId = req.user.id;
  const rating = req.body.rating;

  if (!rating) {
    return res.status(400).json({ error: 'wrong input' });
  }

  const userQuery = await findByUserIdAndShowId(userId, tvId);

  const data = [rating, userQuery.id];
  const q = `UPDATE users_shows SET rating = $1 WHERE id = $2`;

  const result = await query(q, data);
  return res.json(result);
});

router.delete('/tv/:id/rate', requireAuthentication, async (req, res) => {
  const tvId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  const userQuery = await findByUserIdAndShowId(userId, tvId);

  if (userQuery.rating === null) {
    res.status(400).json({ message: 'No rating to delete' });
  }

  const data = [null, userQuery.id];
  const q = `UPDATE users_shows SET rating = $1 WHERE id = $2`;
  const result = await query(q, data);
  return res.json(result);
});

router.post('/tv/:id/state', requireAuthentication, async (req, res) => {
  const tvId = parseInt(req.params.id, 10);
  const userId = req.user.id;
  const status = req.body.status;

  if (!status) {
    return res.status(400).json({ error: 'wrong input' });
  }

  const userQuery = await findByUserIdAndShowId(userId, tvId);

  const data = [tvId, userId, status];

  if (!userQuery || userQuery === null) {
    const q = `INSERT INTO users_shows (show, "user", status) VALUES ($1, $2, $3)`;
    const result = await query(q, data);
    return res.json(result);
  }
  if (userQuery.status === null) {
    const q = `UPDATE users_shows SET status = $1 WHERE id = $2`;
    const result = await query(q, [status, userQuery.id]);
    return res.json(result);
  } else {
    return res.status(401).json({ error: 'Already posted status' });
  }
});

router.patch('/tv/:id/state', requireAuthentication, async (req, res) => {
  const tvId = parseInt(req.params.id, 10);
  const userId = req.user.id;
  const status = req.body.status;

  if (!status) {
    return res.status(400).json({ error: 'wrong input' });
  }

  const userQuery = await findByUserIdAndShowId(userId, tvId);

  const data = [status, userQuery.id];
  const q = `UPDATE users_shows SET status = $1 WHERE id = $2`;

  const result = await query(q, data);
  return res.json(result);
});

router.delete('/tv/:id/state', requireAuthentication, async (req, res) => {
  const tvId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  const userQuery = await findByUserIdAndShowId(userId, tvId);

  if (userQuery.rating === null) {
    res.status(400).json({ message: 'No status to delete' });
  }

  const data = [null, userQuery.id];
  const q = `UPDATE users_shows SET status = $1 WHERE id = $2`;
  const result = await query(q, data);
  return res.json(result);
});
