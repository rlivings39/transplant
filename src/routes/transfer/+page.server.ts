import { db } from '$lib/server/db';
import { land } from '$lib/server/db/schema';

async function loadDbData() {
	const landData = await db.select().from(land);
	console.log(landData);
}
loadDbData();
console.log('Running page.server.ts');