import { db, migrate } from "~/db";
import { profiles, shows } from "~/db/schema";
import { bubble, madeInAbyss } from "~/models/examples";
import { createMovie, createSerie, createVideo, getVideos } from "./helpers";

// test file used to run manually using `bun tests/manual.ts`
// run those before running this script
// export JWT_SECRET="this is a secret";
// export JWT_ISSUER="https://kyoo.zoriya.dev";

await migrate();
await db.delete(shows);
await db.delete(profiles);

const [_, ser] = await createSerie(madeInAbyss);
const [__, mov] = await createMovie(bubble);
const [resp, body] = await createVideo([
	{
		guess: {
			title: "mia",
			episodes: [{ season: 1, episode: 13 }],
			from: "test",
		},
		part: null,
		path: "/video/mia s1e13.mkv",
		rendering: "sha2",
		version: 1,
		for: [{ slug: `${madeInAbyss.slug}-s1e13` }],
	},
	{
		guess: {
			title: "mia",
			episodes: [{ season: 2, episode: 1 }],
			years: [2017],
			from: "test",
		},
		part: null,
		path: "/video/mia 2017 s2e1.mkv",
		rendering: "sha8",
		version: 1,
		for: [{ slug: `${madeInAbyss.slug}-s2e1` }],
	},
	{
		guess: { title: "bubble", from: "test" },
		part: null,
		path: "/video/bubble.mkv",
		rendering: "sha5",
		version: 1,
		for: [{ movie: bubble.slug }],
	},
]);
console.log(body);
const [___, ret] = await getVideos();
console.log(JSON.stringify(ret, undefined, 4));

process.exit(0);
