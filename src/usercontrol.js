import express from 'express';
import passport from 'passport';
import dotenv from 'dotenv';
import { Strategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';

import { comparePasswords, findByUsername, findById } from './users.js';
import { query } from './db.js';

dotenv.config();

export const router = express.Router();

const {
  PORT: port = 3000,
  JWT_SECRET: jwtSecret,
  TOKEN_LIFETIME: tokenLifetime = 120,
  DATABASE_URL: databaseUrl,
} = process.env;

if (!jwtSecret || !databaseUrl) {
  console.error('Vantar .env gildi');
  process.exit(1);
}

router.use(express.json());

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

async function strat(data, next) {
  // fáum id gegnum data sem geymt er í token
  const user = await findById(data.id);

  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
}

passport.use(new Strategy(jwtOptions, strat));

router.use(passport.initialize());

function requireAuthentication(req, res, next) {
  return passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      const error =
        info.name === 'TokenExpiredError' ? 'expired token' : 'invalid token';

      return res.status(401).json({ error });
    }

    // Látum notanda vera aðgengilegan í rest af middlewares
    req.user = user;
    return next();
  })(req, res, next);
}

function requireAdminAuthentication(req, res, next) {
  return passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      const error =
        info.name === 'TokenExpiredError' ? 'expired token' : 'invalid token';

      return res.status(401).json({ error });
    }

    if (!user.admin) {
      return res.status(401).json({ error: 'Not an admin user' });
    }

    req.user = user;
    return next();
  })(req, res, next);
}

router.post('/users/login', async (req, res) => {
  const { username, password = '' } = req.body;

  const user = await findByUsername(username);

  if (!user) {
    return res.status(401).json({ error: 'No such user' });
  }

  const passwordIsCorrect = await comparePasswords(password, user.password);

  if (passwordIsCorrect) {
    const payload = { id: user.id };
    const tokenOptions = { expiresIn: tokenLifetime };
    const token = jwt.sign(payload, jwtOptions.secretOrKey, tokenOptions);
    return res.json({ token });
  }

  return res.status(401).json({ error: 'Invalid password' });
});

router.get('/users', requireAdminAuthentication, async (req, res) => {
  const allusers = await query('SELECT * FROM users');
  const users = [];
  allusers.rows.map((row) => {
    let user = { id: row.id, username: row.username, email: row.email };
    return users.push(user);
  });
  res.json({ users });
});

router.get('/users/:id', requireAdminAuthentication, async (req, res) => {
  const params = req.params;
  const getUser = await query(`SELECT * FROM users WHERE id = ${params.id}`);
  const user = {
    id: getUser.rows[0].id,
    username: getUser.rows[0].username,
    email: getUser.rows[0].email,
  };
  res.json(user);
});

router.patch('/users/:id', requireAdminAuthentication, async (req, res) => {
  const params = req.params;
  const body = req.body;
  const currentUser = req.user;

  // ef reynt er að breyta sér sjálfum
  if (currentUser.id === params.id) {
    res.json({ error: 'Can only change other users' });
  }

  const getUser = await query(`SELECT * FROM users WHERE id = ${params.id}`);

  // ef user sem á að breyta er admin
  if (getUser.rows[0].admin) {
    res.json({ error: 'User already is admin' });
  }

  // Breyting á user
  const changeUser = await query(
    `UPDATE users SET admin = true WHERE id = ${params.id}`
  );

  res.json({ status: 'User is now admin' });
  console.log('Params --> ', params);
  console.log('body --> ', body);
});
