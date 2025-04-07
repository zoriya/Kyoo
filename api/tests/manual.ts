import { db, migrate } from "~/db";
import { profiles, shows } from "~/db/schema";
import { madeInAbyss } from "~/models/examples";
import { createSerie, getSerie, setSerieStatus } from "./helpers";
import { getJwtHeaders } from "./helpers/jwt";

// test file used to run manually using `bun tests/manual.ts`

await migrate();
await db.delete(shows);
await db.delete(profiles);

console.log(await getJwtHeaders());

const [_, ser] = await createSerie(madeInAbyss);
console.log(ser);
const [__, ret] = await setSerieStatus(madeInAbyss.slug, {
	status: "watching",
	startedAt: "2024-12-21",
	completedAt: "2024-12-21",
	seenCount: 2,
	score: 85,
});
console.log(ret);

const [___, got] = await getSerie(madeInAbyss.slug, {});
console.log(JSON.stringify(got, undefined, 4));

process.exit(0);
