import express from 'express';
import passport from 'passport';
import dotenv from 'dotenv';
import xss from 'xss';
import { Strategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';

import {
  comparePasswords,
  findByUsername,
  findById,
  registerUser,
  hashPassword,
} from './users.js';
import { query } from './db.js';
import { catchErrors, validationCheck } from './utils.js';

dotenv.config();

export const router = express.Router();

const userValidation = [
  body('username')
    .isLength({ min: 1 })
    .withMessage('Notendanafn má ekki vera tómt'),
  body('username')
    .isLength({ max: 16 })
    .withMessage('Notendanafn má vera að hámarki 16 stafir'),
  body('email').isLength({ min: 1 }).withMessage('Netfang má ekki vera tómt'),
  body('email').isEmail().withMessage('Netfang verður að vera gilt netfang'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Notendanafn má ekki vera tómt'),
  body('password')
    .isLength({ max: 32 })
    .withMessage('Notendanafn má vera að hámarki 32 stafir'),
  body('password')
    .custom((value) => !/\s/.test(value))
    .withMessage('Lykilorð má ekki innihalda bil'),
];

const isEmpty = (s) => s != null && !s;

async function validateUser({ username, password, name }, patch = false) {
  const validationMessages = [];

  // can't patch username
  if (!patch) {
    const m = 'Username is required, must be at least three letters and no more than 32 characters';
    if (
      typeof username !== 'string'
      || username.length < 3
      || username.length > 32
    ) {
      validationMessages.push({ field: 'username', message: m });
    }

    const user = await findByUsername(username);

    if (user) {
      validationMessages.push({
        field: 'username',
        message: 'Username is already registered',
      });
    }
  }

  if (!patch || password || isEmpty(password)) {
    if (typeof password !== 'string' || password.length < 6) {
      validationMessages.push({
        field: 'password',
        message: 'Password must be at least six letters',
      });
    }
  }

  if (!patch || name || isEmpty(name)) {
    if (typeof name !== 'string' || name.length === 0 || name.length > 64) {
      validationMessages.push({
        field: 'name',
        message:
          'Name is required, must not be empty or longar than 64 characters',
      });
    }
  }

  return validationMessages;
}

const xssUserSanitize = [
  body('username').customSanitizer((v) => xss(v)),
  body('email').customSanitizer((v) => xss(v)),
];

const {
  JWT_SECRET: jwtSecret,

  TOKEN_LIFETIME: tokenLifetime = 1200,
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
      const error = info.name === 'TokenExpiredError' ? 'expired token' : 'invalid token';

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
      const error = info.name === 'TokenExpiredError' ? 'expired token' : 'invalid token';

      return res.status(401).json({ error });
    }

    if (!user.admin) {
      return res.status(401).json({ error: 'Not an admin user' });
    }

    req.user = user;
    return next();
  })(req, res, next);
}

export function isLoggedIn(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    return next();
  }

  return passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return false;
    }

    if (!user) {
      return next();
    }

    // Látum notanda vera aðgengilegan í rest af middlewares
    req.user = user;
    return next();
  })(req, res, next);
}

/**
 * /users/login POST,
 * Skráir notanda inn.
 */
router.post('/users/login', async (req, res) => {
  const { username, password = '' } = req.body;
  const user = await findByUsername(username);

  const validationMessage = validateUser({ username, password }, true);

  if (validationMessage.length > 0) {
    return res.status(400).json({ errors: validationMessage });
  }

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
/**
 * /users GET,
 * skilar síðu af notendum, aðeins ef notandi sem framkvæmir er stjórnandi
 */
router.get('/users', requireAdminAuthentication, async (req, res) => {
  const allusers = await query('SELECT * FROM users');
  const users = [];
  allusers.rows.map((row) => {
    const user = { id: row.id, username: row.username, email: row.email };
    return users.push(user);
  });
  return res.json({ users });
});

/**
 * /users/me GET,
 * skilar upplýsingum um notanda
 * sem á token,
 * auðkenni og netfangi,
 * aðeins ef notandi innskráður
 */
router.get('/users/me', requireAuthentication, async (req, res, next) => {
  if (req.method === 'PATCH') {
    return next();
  }
  const { id, username, email } = req.user;
  const user = { id, username, email };
  return res.json(user);
});

router.patch('/users/me', requireAuthentication, async (req, res) => {
  const { id } = req.user;
  const { email, password } = req.body;
  const validationMessage = validateUser({ email, password }, true);

  if (validationMessage.length > 0) {
    return res.status(400).json({ errors: validationMessage });
  }

  if (email !== undefined && password !== undefined) {
    const hashedPassword = await hashPassword(password);
    await query(
      `UPDATE users SET (email, password) = ('${email}', '${hashedPassword}') WHERE id = ${id}`,
    );
    return res.json({ message: 'User has been updated' });
  } if (email) {
    await query(`UPDATE users SET email = '${email}' WHERE id = ${id}`);
    return res.json({ message: 'User has been updated' });
  } if (password) {
    const hashedPassword = await hashPassword(password);
    await query(
      `UPDATE users SET password = '${hashedPassword}' WHERE id = ${id}`,
    );
    return res.json({ message: 'User has been updated' });
  }
  return res.json({ error: 'no input' });
});

/**
 * /users/:id GET,
 * skilar notanda,
 * aðeins ef notandi sem framkvæmir er stjórnandi
 */
router.get('/users/:id', requireAdminAuthentication, async (req, res) => {
  const { params } = req;
  const getUser = await query(`SELECT * FROM users WHERE id = ${params.id}`);
  const user = {
    id: getUser.rows[0].id,
    username: getUser.rows[0].username,
    email: getUser.rows[0].email,
  };

  return res.json(user);
});

/**
 * /users/:id PATCH,
 * breytir hvort notandi sé stjórnandi eða ekki
 * aðeins ef notandi sem framkvæmir er stjórnandi
 * og er ekki að breyta sér sjálfum
 */
router.patch('/users/:id', requireAdminAuthentication, async (req, res) => {
  const { params } = req;
  const currentUser = req.user;

  // ef reynt er að breyta sér sjálfum
  if (currentUser.id === params.id) {
    return res.json({ error: 'Can only change other users' });
  }

  const getUser = await query(`SELECT * FROM users WHERE id = ${params.id}`);

  // ef user sem á að breyta er admin
  if (getUser.rows[0].admin) {
    return res.json({ error: 'User already is admin' });
  }
  // Breyting á user
  await query(`UPDATE users SET admin = true WHERE id = ${params.id}`);

  return res.json({ status: 'User is now admin' });
});

/**
 * Skráir nýjan notanda í gagnagrunn.
 */
router.post(
  '/users/register',
  userValidation,
  xssUserSanitize,
  catchErrors(validationCheck),
  async (req, res) => {
    const { username, email, password = '' } = req.body;
    const user = await findByUsername(username);

    if (user) {
      return res.status(401).json({ error: 'User already registered' });
    }

    const newUser = await registerUser(username, email, password);
    const { id } = newUser;

    const data = {
      id,
      username: newUser.username,
      email: newUser.email,
      admin: newUser.admin,
      created: new Date(),
      updated: new Date(),
    };

    if (id) {
      return res.json(data);
    }

    return res.status(401).json({ error: 'Could not register user ' });
  },
);
