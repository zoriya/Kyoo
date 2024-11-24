import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const db = drizzle({
	schema,
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
