import {drizzle} from 'drizzle-orm/node-postgres';
import * as schema from './schema'; // ✅ Import your schema

import {Pool} from 'pg';


// Parse DATABASE_URL into individual components
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/statemachine?sslmode=require';

const pool = new Pool({
    connectionString: connectionString,
});
export const db = drizzle(pool, {schema});
