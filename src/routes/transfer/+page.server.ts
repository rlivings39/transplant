import { db } from '$lib/server/db';
import { land, planting, crop } from '$lib/server/db/schema';

export async function load() {
  const landsDbTable = await db.select().from(land).limit(1);
  const plantingDbTable = await db.select().from(planting).limit(1);
  const cropDbTable = await db.select().from(crop).limit(1);
  return { landsDbTable, plantingDbTable, cropDbTable };
}