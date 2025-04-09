import { db } from '$lib/server/db';
import { land } from '$lib/server/db/schema';

export async function load() {
  const lands = await db.select().from(land);
  return { lands };
}