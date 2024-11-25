import jwt from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Elysia } from "elysia";
import { entries } from "./controllers/entries";
import { movies } from "./controllers/movies";
import { seasons } from "./controllers/seasons";
import { seed } from "./controllers/seed";
import { series } from "./controllers/series";
import { videos } from "./controllers/videos";
import { db } from "./db";
import { Image } from "./models/utils";
import { comment } from "./utils";

await migrate(db, { migrationsSchema: "kyoo", migrationsFolder: "./drizzle" });

if (process.env.SEED) {
}

let secret = process.env.JWT_SECRET;
if (!secret) {
	const auth = process.env.AUTH_SERVER ?? "http://auth:4568";
	try {
		const ret = await fetch(`${auth}/info`);
		const info = await ret.json();
		secret = info.publicKey;
	} catch (error) {
		console.error(`Can't access auth server at ${auth}:\n${error}`);
	}
}

if (!secret) {
	console.error("Missing jwt secret or auth server. exiting");
	process.exit(1);
}

const app = new Elysia()
	.use(jwt({ secret }))
	.use(
		swagger({
			documentation: {
				info: {
					title: "Kyoo",
					description: comment`
						Complete API documentation of Kyoo.
						If you need a route not present here, please make an issue over https://github.com/zoriya/kyoo
					`,
					version: "5.0.0",
					contact: { name: "github", url: "https://github.com/zoriya/kyoo" },
					license: {
						name: "GPL-3.0 license",
						url: "https://github.com/zoriya/Kyoo/blob/master/LICENSE",
					},
				},
				servers: [
					{
						url: "https://kyoo.zoriya.dev/api",
						description: "Kyoo's demo server",
					},
				],
				tags: [
					{ name: "movies", description: "Routes about movies" },
					{
						name: "videos",
						description: comment`
							Used by the scanner internally to list & create videos.
							Can be used for administration or third party apps.
						`,
					},
				],
			},
		}),
	)
	.get("/", () => "Hello Elysia")
	.model({ image: Image })
	.use(movies)
	.use(series)
	.use(entries)
	.use(seasons)
	.use(videos)
	.use(seed)
	.listen(3000);

console.log(`Api running at ${app.server?.hostname}:${app.server?.port}`);
