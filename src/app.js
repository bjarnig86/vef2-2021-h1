import express from 'express';
import dotenv from 'dotenv';

import { router as userRouter } from './usercontrol.js';
import { router as tvRouter } from './tvRouting.js';

dotenv.config();

const { PORT: port = 3002 } = process.env;

const app = express();

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
app.use(tvRouter);

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
