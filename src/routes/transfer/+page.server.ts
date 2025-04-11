import { db } from '$lib/server/db';
import { land, planting } from '$lib/server/db/schema';

export async function load() {
  const landsDbTable = await db.select().from(land);
  const plantingDbTable = await db.select().from(planting);
  // const cropDbTable = await db.select().from(crop);
  return { landsDbTable, plantingDbTable };
}