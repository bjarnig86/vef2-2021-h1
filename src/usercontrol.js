/* eslint-disable linebreak-style */
import express from 'express';
import passport from 'passport';
import dotenv from 'dotenv';
import { Strategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

import {
  comparePasswords,
  findByUsername,
  findById,
  registerUser,
  hashPassword,
} from './users.js';
import { query } from './db.js';

dotenv.config();

export const router = express.Router();

const {
  JWT_SECRET: jwtSecret,
  TOKEN_LIFETIME: tokenLifetime = 240,
} = process.env;

if (!jwtSecret) {
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

export function requireAuthentication(req, res, next) {
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

export function requireAdminAuthentication(req, res, next) {
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
  return res.json({ users });
});

router.get('/users/me', requireAuthentication, async (req, res) => {
  if (req.method === 'PATCH') {
    next();
  }
  const { id, username, email } = req.user;
  const user = { id: id, username: username, email: email };
  return res.json(user);
});

router.patch('/users/me', requireAuthentication, async (req, res) => {
  const { id } = req.user;
  const { email, password } = req.body;

  if (email !== undefined && password !== undefined) {
    const hashedPassword = await hashPassword(password);
    await query(
      `UPDATE users SET (email, password) = ('${email}', '${hashedPassword}') WHERE id = ${id}`
    );
    res.json({ message: 'User has been updated' });
  } else if (email) {
    await query(`UPDATE users SET email = '${email}' WHERE id = ${id}`);
    res.json({ message: 'User has been updated' });
  } else if (password) {
    const hashedPassword = await hashPassword(password);
    await query(
      `UPDATE users SET password = '${hashedPassword}' WHERE id = ${id}`
    );
    res.json({ message: 'User has been updated' });
  } else {
    res.json({ error: 'no input' });
  }
});

router.get('/users/:id', requireAdminAuthentication, async (req, res) => {
  const params = req.params;
  const getUser = await query(`SELECT * FROM users WHERE id = ${params.id}`);
  const user = {
    id: getUser.rows[0].id,
    username: getUser.rows[0].username,
    email: getUser.rows[0].email,
  };

  return res.json(user);
});

router.patch('/users/:id', requireAdminAuthentication, async (req, res) => {
  const params = req.params;
  const body = req.body;
  const currentUser = req.user;

  // ef reynt er að breyta sér sjálfum
  if (currentUser.id === params.id) {
    return res.json({ error: 'Can only change other users' });
  }

  const getUser = await query(`SELECT * FROM users WHERE id = ${params.id}`);

  // ef user sem á að breyta er admin
  if (getUser.rows[0].admin) {
    return res.json({ error: 'User already is admin' });
  } else {
    // Breyting á user
    await query(`UPDATE users SET admin = true WHERE id = ${params.id}`);

    return res.json({ status: 'User is now admin' });
  }
});

router.post('/users/register', async (req, res) => {
  const { username, email, password = '' } = req.body;
  const user = await findByUsername(username);

  if (user) {
    return res.status(401).json({ error: 'User already registered' });
  }

  const id = registerUser(username, email, password);

  // const passwordIsCorrect = await comparePasswords(password, user.password);

  if (id) {
    const payload = { id };
    const tokenOptions = { expiresIn: tokenLifetime };
    const token = jwt.sign(payload, jwtOptions.secretOrKey, tokenOptions);
    return res.json({ token });
  }

  return res.status(401).json({ error: 'Could not register user ' });
});
