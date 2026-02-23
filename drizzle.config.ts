import type { Config } from 'drizzle-kit';

const config: Config = {
    schema: './lib/schema.ts',
    out: './drizzle',
    dialect: 'postgresql', // ✅ Use 'dialect' for v0.20+ (including v0.31.9)
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
};

export default config;
