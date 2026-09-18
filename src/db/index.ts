import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL!.replace('?ssl-mode=REQUIRED', ''),
  ssl: {
    rejectUnauthorized: true,
  },
});

export const db = drizzle(connection, { schema, mode: 'default' });