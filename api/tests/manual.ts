import { db, migrate } from "~/db";
import { profiles, shows } from "~/db/schema";
import { madeInAbyss } from "~/models/examples";
import { createSerie, createVideo } from "./helpers";

// test file used to run manually using `bun tests/manual.ts`
// run those before running this script
// export JWT_SECRET="this is a secret";
// export JWT_ISSUER="https://kyoo.zoriya.dev";

await migrate();
await db.delete(shows);
await db.delete(profiles);

const [__, ser] = await createSerie(madeInAbyss);
console.log(ser);
const [_, body] = await createVideo({
	guess: { title: "mia", season: [1], episode: [13], from: "test" },
	part: null,
	path: "/video/mia s1e13.mkv",
	rendering: "renderingsha",
	version: 1,
	for: [
		{
			serie: madeInAbyss.slug,
			season: madeInAbyss.entries[0].seasonNumber!,
			episode: madeInAbyss.entries[0].episodeNumber!,
		},
	],
});
console.log(body);

process.exit(0);
