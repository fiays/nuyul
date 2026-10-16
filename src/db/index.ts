import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL!.replace('?ssl-mode=REQUIRED', ''),
  ssl: {
    rejectUnauthorized: false, // <-- UBAH KE false
  },
});

export const db = drizzle(connection, { schema, mode: 'default' });