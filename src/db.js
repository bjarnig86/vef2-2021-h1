import pg from 'pg';
import dotenv from 'dotenv';

// Sækir gögn úr .env.
dotenv.config();

// Setur .env gögn í breytur.
const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}

// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development mode, þ.e.a.s. á local vél
const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;

// Setur upp tengi pool fyrir samskipti við gagnagrunn.
const pool = new pg.Pool({ connectionString, ssl, max: 1 });
pool.on('error', (err) => {
  console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
  process.exit(-1);
});

/**
 * Almennt kall í gagnagrunn. Tekur á móti query streng og gögnum í fylki.
 * @param {String} _query Strengur með beiðni í gagnagrunn
 * @param {Array} values Gögn sem sett eru í strenginn.
 */
export async function query(q, values = []) {
  const client = await pool.connect();

  let result;

  try {
    result = await client.query(q, values);
  } catch (err) {
    console.error('Villa í query', err);
    return err;
  } finally {
    client.release();
    
  }

  return result;
}

// Helper to remove pg from the event loop
export async function end() {
  await pool.end();
}
