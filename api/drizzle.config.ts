import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
	migrations: {
		schema: "kyoo",
	},
});
