import { beforeAll } from "bun:test";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "~/db";

beforeAll(async () => {
	await migrate(db, {
		migrationsSchema: "kyoo",
		migrationsFolder: "./drizzle",
	});
});
