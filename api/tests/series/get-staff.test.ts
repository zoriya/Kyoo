import { beforeAll, describe, expect, it } from "bun:test";
import { createSerie, getStaff, getStaffRoles } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { madeInAbyss } from "~/models/examples";

beforeAll(async () => {
	await createSerie(madeInAbyss);
});

describe("Get a staff member", () => {
	it("Invalid slug", async () => {
		const [resp, body] = await getStaff("sotneuhn", {});

		expectStatus(resp, body).toBe(404);
		expect(body).toMatchObject({
			status: 404,
			message: expect.any(String),
		});
	});
	it("Get staff by id", async () => {
		const member = madeInAbyss.staff[0].staff;
		const [resp, body] = await getStaff(member.slug, {});

		expectStatus(resp, body).toBe(200);
		expect(body.slug).toBe(member.slug);
		expect(body.latinName).toBe(member.latinName);
	});
});
