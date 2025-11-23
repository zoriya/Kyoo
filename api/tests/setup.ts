import { beforeAll } from "bun:test";

process.env.PGDATABASE = "kyoo_test";
process.env.JWT_SECRET = "this is a secret";
process.env.JWT_ISSUER = "https://kyoo.zoriya.dev";

beforeAll(async () => {
	// lazy load this so env set before actually applies
	const { migrate } = await import("~/db");
	await migrate();
});
