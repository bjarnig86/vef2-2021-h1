// import { join, dirname } from 'path';
// import { fileURLToPath } from 'url';

import express from 'express';
import dotenv from 'dotenv';
import { query } from './db.js';

import {
  requireAdminAuthentication,
  requireAuthentication,
} from './usercontrol.js';

export const router = express.Router();

router.use(express.json());

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

router.post('/tv', requireAdminAuthentication, async (req, res, next) => {
  const {
    id,
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
    id,
    title,
    (first_aired = new Date()),
    in_production,
    tagline,
    image,
    description,
    language,
    network,
    webpage,
  ];

  const q = `INSERT INTO shows 
  (id, title, first_aired, in_production, tagline, image, description, language, network, webpage) 
  VALUES
  ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
  const result = await query(q, showData);

  return res.json(result);
});

/**
 * /tv/:id GET skilar stöku sjónvarpsþáttum með grunnupplýsingum,
 * meðal einkunn sjónvarpsþáttar, fjölda einkunna sem hafa verið
 * skráðar fyrir sjónvarpsþátt, fylki af tegundum sjónvarpsþáttar
 * (genres), fylki af seasons, rating notanda, staða notanda
 */
 router.get('/tv/:id', requireAuthentication, async (req, res, next) => {
  console.log(`tvRouting.js: /tv/:id req.params.id --> ${req.params.id}`);
  
  const currentUser = req.user;

  const qA = 'SELECT row_to_json (shows) FROM shows WHERE id = $1';
  const show = await query(qA, [req.params.id]);
  
  const qB = 'SELECT * FROM users_shows WHERE show = $1';
  const userShow = await query(qB, [req.params.id]);

  let showRatingTotal= 0;
  userShow.rows.forEach(element => {
    showRatingTotal += element.rating;
  });

  // const showRatingAverage = showRatingTotal / userShow.rows.length;
  // console.log(`showRatingTotal: ${showRatingTotal}`);
  // console.log(`showRatingAverage: ${showRatingAverage}`);

  // q = 'SELECT rating FROM users_shows WHERE show = $1';

  const result = {
    show: show.rows[0].row_to_json,
    showRatingAverage: showRatingTotal / userShow.rows.length,
    showRatingCount: userShow.rows.length,
   };
  

  res.json(result);
});
