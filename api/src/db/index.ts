import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate as migrateDb } from "drizzle-orm/node-postgres/migrator";
import * as schema from "./schema";

const dbConfig = {
	user: process.env.POSTGRES_USER ?? "kyoo",
	password: process.env.POSTGRES_PASSWORD ?? "password",
	database: process.env.POSTGRES_DB ?? "kyoo",
	host: process.env.POSTGRES_SERVER ?? "postgres",
	port: Number(process.env.POSTGRES_PORT) || 5432,
	ssl: false,
};
export const db = drizzle({
	schema,
	connection: dbConfig,
	casing: "snake_case",
});

export const migrate = async () => {
	await db.execute(
		sql.raw(`
			create extension if not exists pg_trgm;
			SET pg_trgm.word_similarity_threshold = 0.4;
			ALTER DATABASE "${dbConfig.database}" SET pg_trgm.word_similarity_threshold = 0.4;
		`),
	);
	await migrateDb(db, {
		migrationsSchema: "kyoo",
		migrationsFolder: "./drizzle",
	});
	console.log(`Database ${dbConfig.database} migrated!`);
};

export type Transaction =
	| typeof db
	| Parameters<Parameters<typeof db.transaction>[0]>[0];
