import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { expectStatus } from "tests/utils";
import { db } from "~/db";
import { seasons, shows, videos } from "~/db/schema";
import { madeInAbyss, madeInAbyssVideo } from "~/models/examples";
import { createSerie } from "../helpers";

describe("Serie seeding", () => {
	it("Can create a serie with seasons and episodes", async () => {
		// create video beforehand to test linking
		await db.insert(videos).values(madeInAbyssVideo);
		const [resp, body] = await createSerie(madeInAbyss);

		expectStatus(resp, body).toBe(201);
		expect(body.id).toBeString();
		expect(body.slug).toBe("made-in-abyss");

		const ret = await db.query.shows.findFirst({
			where: eq(shows.id, body.id),
			with: {
				seasons: { orderBy: seasons.seasonNumber },
				entries: true,
			},
		});

		expect(ret).not.toBeNull();
		expect(ret!.seasons).toBeArrayOfSize(2);
		expect(ret!.seasons[0].slug).toBe("made-in-abyss-s1");
		expect(ret!.seasons[1].slug).toBe("made-in-abyss-s2");
		// expect(ret!.entries).toBeArrayOfSize(
		// 	madeInAbyss.entries.length + madeInAbyss.extras.length,
		// );
	});
});
