import type { Config } from 'drizzle-kit';

const config: Config = {
    schema: './lib/schema.ts',
    out: './drizzle',
    connectionString: process.env.DATABASE_URL,
};

export default config;
