import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { readFileSync } from 'fs';
import { join } from 'path';

if (!env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

// SSL configuration
const sslConfig =
	env.NODE_ENV === 'production'
		? { ssl: true }
		: {
				ssl: {
					rejectUnauthorized: env.SSL_REJECT_UNAUTHORIZED !== 'false',
					ca: env.SSL_CA_PATH ? readFileSync(env.SSL_CA_PATH).toString() : undefined
				}
			};

const client = postgres(env.DATABASE_URL, {
	...sslConfig,
	prepare: false
});

export const db = drizzle(client, { schema });
