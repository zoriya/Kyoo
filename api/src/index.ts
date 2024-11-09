import jwt from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Elysia } from "elysia";
import { entries } from "./controllers/entries";
import { movies } from "./controllers/movies";
import { seasons } from "./controllers/seasons";
import { series } from "./controllers/series";
import { videos } from "./controllers/videos";
import { db } from "./db";

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
	.use(swagger())
	.get("/", () => "Hello Elysia")
	.use(movies)
	.use(series)
	.use(entries)
	.use(seasons)
	.use(videos)
	.listen(3000);

console.log(`Api running at ${app.server?.hostname}:${app.server?.port}`);
