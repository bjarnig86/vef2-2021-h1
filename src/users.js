import bcrypt from 'bcrypt';
import { query } from './db.js';

export async function comparePasswords(password, hash) {
  const result = await bcrypt.compare(password, hash);

  return result;
}

export async function findByUsername(username) {
  const q = 'SELECT * FROM users WHERE username = $1';

  try {
    const result = await query(q, [username]);

    if (result.rowCount === 1) {
      return result.rows[0];
    }
  } catch (e) {
    console.error('Gat ekki fundið notanda eftir notendnafni');
    return null;
  }

  return false;
}

export async function findById(id) {
  const q = 'SELECT * FROM users WHERE id = $1';

  try {
    const result = await query(q, [id]);

    if (result.rowCount === 1) {
      return result.rows[0];
    }
  } catch (e) {
    console.error('Gat ekki fundið notanda eftir id');
  }

  return null;
}

export async function findByUserIdAndShowId(userId, show) {
  const q = 'SELECT * FROM users_shows WHERE "user" = $1 AND show = $2';

  try {
    const result = await query(q, [userId, show]);

    if (result.rowCount === 1) {
      return result.rows[0];
    }
  } catch (e) {
    console.error('Gat ekki fundið notanda eftir notanda id');
    return null;
  }

  return false;
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 11);
}

export async function registerUser(username, email, password) {
  const hashedPassword = await hashPassword(password);
  const q =
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *';

  try {
    const result = await query(q, [username, email, hashedPassword]);

    if (result.rowCount === 1) {
      return result.rows[0];
    }
  } catch (e) {
    console.error('Postgres: Could not register user');
  }

  return null;
}

export async function findByShowId(show) {
  const q = 'SELECT * FROM users_shows WHERE show = $1';

  try {
    const result = await query(q, [show]);

    if (result.rowCount > 0) {
      return result.rows;
    }
  } catch (e) {
    console.error('Gat ekki fundið notanda eftir notanda id');
    return null;
  }

  return false;
}
