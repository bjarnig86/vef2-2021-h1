import { readFile } from 'fs/promises';
import { query, end } from './db.js';

// import { importData } from './importcsv.js'

const schemaFile = './sql/schema.sql';

/**
 * Býr til töflur í grunni og gervigögn.
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
