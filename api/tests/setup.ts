import { beforeAll } from "bun:test";
import { migrate } from "~/db";

process.env.JWT_SECRET = "this is a secret";
process.env.JWT_ISSUER = "https://kyoo.zoriya.dev";

beforeAll(async () => {
	await migrate();
});
