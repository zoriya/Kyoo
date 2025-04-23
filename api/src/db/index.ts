import os from "node:os";
import path from "node:path";
import tls, { type ConnectionOptions } from "node:tls";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate as migrateDb } from "drizzle-orm/node-postgres/migrator";
import type { PoolConfig } from "pg";
import * as schema from "./schema";

async function getPostgresConfig(): Promise<PoolConfig> {
	const config: PoolConfig = {
		connectionString: process.env.POSTGRES_URL,
		host: process.env.PGHOST ?? "postgres",
		port: Number(process.env.PGPORT) || 5432,
		database: process.env.PGDATABASE ?? "kyoo",
		user: process.env.PGUSER ?? "kyoo",
		password: process.env.PGPASSWORD ?? "password",
		options: process.env.PGOPTIONS,
		application_name: process.env.PGAPPNAME ?? "kyoo",
	};

	// Due to an upstream bug, if `ssl` is not falsey, an SSL connection will always be attempted. This means
	// that non-SSL connection options under `ssl` (which is incorrectly named) cannot be set unless SSL is enabled.
	if (!process.env.PGSSLMODE || process.env.PGSSLMODE === "disable")
		return config;

	// Despite this field's name, it is used to configure everything below the application layer.
	const ssl: ConnectionOptions = {};

	if (process.env.PGPASSFILE || !process.env.PGPASSWORD) {
		const file = Bun.file(
			process.env.PGPASSFILE ?? path.join(os.homedir(), ".pgpass"),
		);
		if (await file.exists()) {
			config.password = await file.text();
		}
	}

	// Handle https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-SSLROOTCERT
	if (process.env.PGSSLROOTCERT === "system") {
		// Bun does not currently support getCACertificates. Until this is supported,
		// use the closest equivalent, which loads the bundled CA certs rather than the system CA certs.
		// ssl.ca = tls.getCACertificates("system");
		ssl.ca = [...tls.rootCertificates];

		if (!process.env.PGSSLMODE) {
			process.env.PGSSLMODE = "verify-full";
		}
		if (process.env.PGSSLMODE && process.env.PGSSLMODE !== "verify-full") {
			throw new Error(
				"PGSSLROOTCERT=system is only supported with PGSSLMODE=verify-full. See Postgres docs for details.",
			);
		}
	} else {
		const file = Bun.file(
			process.env.PGSSLROOTCERT ??
				path.join(os.homedir(), ".postgresql", "root.crt"),
		);
		if (await file.exists()) {
			ssl.ca = await file.text();
		}
	}

	// TODO support CRLs. This requires verifying the contents against symlink hashes prepared by `openssl c_rehash`,
	// as described in the postgres docs for PGSSLCRL and PGSSLCRLDIR. This isn't terribly common, so it's not currently
	// implemented.

	let file = Bun.file(
		process.env.PGSSLCERT ??
			path.join(os.homedir(), ".postgresql", "postgresql.crt"),
	);
	if (await file.exists()) {
		ssl.cert = await file.text();
	}

	file = Bun.file(
		process.env.PGSSLKEY ??
			path.join(os.homedir(), ".postgresql", "postgresql.key"),
	);
	if (await file.exists()) {
		ssl.key = await file.text();
	}

	if (process.env.PGSSLMODE) {
		switch (process.env.PGSSLMODE) {
			// Disable is handled above, gateing the configurating of any SSL options.
			// Allow and prefer are not currently supported. Supporting them would require
			// either mulitiple attempted connections, or changes upstream to the postgres driver.
			case "verify-ca":
				ssl.rejectUnauthorized = true;
				ssl.checkServerIdentity = (_host, _cert) => {
					return undefined;
				};
				break;
			case "verify-full":
				ssl.rejectUnauthorized = true;
				break;
			default:
				ssl.checkServerIdentity = (_host, _cert) => {
					return undefined;
				};
				ssl.rejectUnauthorized = false;
		}
	}

	config.ssl = ssl;
	return config;
}

const postgresConfig = await getPostgresConfig();

export const db = drizzle({
	schema,
	connection: postgresConfig,
	casing: "snake_case",
});

export const migrate = async () => {
	await db.execute(
		sql.raw(`
			create extension if not exists pg_trgm;
			SET pg_trgm.word_similarity_threshold = 0.4;
			ALTER DATABASE "${postgresConfig.database}" SET pg_trgm.word_similarity_threshold = 0.4;
		`),
	);
	await migrateDb(db, {
		migrationsSchema: "kyoo",
		migrationsFolder: "./drizzle",
	});
	console.log(`Database ${postgresConfig.database} migrated!`);
};

export type Transaction =
	| typeof db
	| Parameters<Parameters<typeof db.transaction>[0]>[0];
