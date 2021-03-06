// eslint-disable-next-line import/no-unresolved
import { readFile } from 'fs/promises';
import { query, end } from './db.js';

const schemaFile = './sql/schema.sql';

/**
 * Býr til töflur í grunni.
 */
async function create() {
  const data = await readFile(schemaFile);

  await query(data.toString('utf-8'));
  console.info('Schema created');

  await end();
}

create().catch((err) => {
  console.error('Error creating schema', err);
});
