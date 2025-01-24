import { beforeAll } from "bun:test";
import { migrate } from "~/db";

beforeAll(async () => {
	await migrate();
});
