import { drizzle } from "drizzle-orm/node-postgres";
import * as entries from "./schema/entries";
import * as seasons from "./schema/seasons";
import * as shows from "./schema/shows";
import * as videos from "./schema/videos";

export const db = drizzle({
	schema: {
		...entries,
		...shows,
		...seasons,
		...videos,
	},
	connection: {
		user: process.env.POSTGRES_USER ?? "kyoo",
		password: process.env.POSTGRES_PASSWORD ?? "password",
		database: process.env.POSTGRES_DB ?? "kyooDB",
		host: process.env.POSTGRES_SERVER ?? "postgres",
		port: Number(process.env.POSTGRES_PORT) || 5432,
		ssl: false,
	},
	casing: "snake_case",
});
