import { beforeAll, describe, expect, it } from "bun:test";
import {
	createSerie,
	getSerieStaff,
	getStaff,
	getStaffRoles,
} from "tests/helpers";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { staff } from "~/db/schema";
import { madeInAbyss } from "~/models/examples";

beforeAll(async () => {
	await db.delete(staff);
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
	it("Get staff's roles", async () => {
		const role = madeInAbyss.staff[0];
		const [resp, body] = await getStaffRoles(role.staff.slug, {});

		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].kind).toBe(role.kind);
		expect(body.items[0].character.name).toBe(role.character.name);
		expect(body.items[0].show.slug).toBe(madeInAbyss.slug);
	});
	it("Get series's staff", async () => {
		const role = madeInAbyss.staff[0];
		const [resp, body] = await getSerieStaff(madeInAbyss.slug, {});

		expectStatus(resp, body).toBe(200);
		expect(body.items).toBeArrayOfSize(1);
		expect(body.items[0].kind).toBe(role.kind);
		expect(body.items[0].character.name).toBe(role.character.name);
		expect(body.items[0].staff.slug).toBe(role.staff.slug);
		expect(body.items[0].staff.name).toBe(role.staff.name);
	});
});
