import express from 'express';
import dotenv from 'dotenv';

import { router as userRouter } from './usercontrol.js';
import { router as tvRouter } from './tvRouting.js';
import { router as tvSeasonRouter } from './tvSeason.js';
import { router as episodeRouter } from './episodes.js';
import { router as userRatingRouter } from './tvRateState.js';
import { router as genreRouter } from './genresRouter.js';

dotenv.config();

const { PORT: port = 3000 } = process.env;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    tv: {
      series: { href: '/tv', methods: ['GET', 'POST'] },
      serie: { href: '/tv/{id}', methods: ['GET', 'PATCH', 'DELETE'] },
      rate: { href: '/tv/{id}/rate', methods: ['POST', 'PATCH', 'DELETE'] },
      state: { href: '/tv/{id}/state', methods: ['POST', 'PATCH', 'DELETE'] },
    },
    seasons: {
      seasons: { href: '/tv/{id}/season', methods: ['GET', 'POST'] },
      season: { href: '/tv/{id}/season/{season}', methods: ['GET', 'DELETE'] },
    },
    episodes: {
      episodes: { href: '/tv/{id}/season/{season}/episode', methods: ['POST'] },
      episode: {
        href: '/tv/{id}/season/{season}/episode/{episode}',
        methods: ['GET', 'DELETE'],
      },
    },
    genres: { genres: { href: '/genres', methods: ['GET', 'POST'] } },
    users: {
      users: { href: '/users', methods: ['GET'] },
      user: { href: '/users/{id}', methods: ['GET', 'PATCH'] },
      register: { href: '/users/register', methods: ['POST'] },
      login: { href: '/users/login', methods: ['POST'] },
      me: { href: '/users/me', methods: ['GET', 'PATCH'] },
    },
  });
});

app.use(userRouter);
app.use(userRatingRouter);
app.use(tvRouter);
app.use(tvSeasonRouter);
app.use(episodeRouter);
app.use(genreRouter);

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
