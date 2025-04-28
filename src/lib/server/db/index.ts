import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

// No encodeURI, no manual SSL config
const client = env.DEBUG ? null : postgres(env.DATABASE_URL, {
	prepare: false,
	ssl: {
		rejectUnauthorized: false
	}
});

export const db = env.DEBUG ? null : drizzle(client as postgres.Sql, { schema });
