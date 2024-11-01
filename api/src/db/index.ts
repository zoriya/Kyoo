import * as entries from "./schema/entries";
import * as shows from "./schema/shows";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle({
	schema: {
		...entries,
		...shows,
	},
	connection: {
		user: process.env.POSTGRES_USER ?? "kyoo",
		password: process.env.POSTGRES_PASSWORD ?? "password",
		database: process.env.POSTGRES_DB ?? "kyooDB",
		host: process.env.POSTGRES_SERVER ?? "postgres",
		port: Number(process.env.POSTGRES_PORT) || 5432,
		ssl: true,
	},
	casing: "snake_case",
});
