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
				entries: { with: { translations: true } },
			},
		});

		expect(ret).not.toBeNull();
		expect(ret!.seasons).toBeArrayOfSize(2);
		expect(ret!.seasons[0].slug).toBe("made-in-abyss-s1");
		expect(ret!.seasons[1].slug).toBe("made-in-abyss-s2");
		expect(ret!.entries).toBeArrayOfSize(
			madeInAbyss.entries.length + madeInAbyss.extras.length,
		);

		const ep13 = madeInAbyss.entries.find((x) => x.order === 13)!;
		expect(ret!.entries.find((x) => x.order === 13)).toMatchObject({
			...ep13,
			slug: "made-in-abyss-s1e13",
			thumbnail: { source: ep13.thumbnail },
			translations: [
				{
					language: "en",
					...ep13.translations.en,
				},
			],
		});

		const { number, ...special } = madeInAbyss.entries.find(
			(x) => x.kind === "special",
		)!;
		expect(ret!.entries.find((x) => x.kind === "special")).toMatchObject({
			...special,
			slug: "made-in-abyss-sp3",
			episodeNumber: number,
			thumbnail: { source: special.thumbnail },
			translations: [
				{
					language: "en",
					...special.translations.en,
				},
			],
		});

		const movie = madeInAbyss.entries.find((x) => x.kind === "movie")!;
		expect(ret!.entries.find((x) => x.kind === "movie")).toMatchObject({
			...movie,
			thumbnail: { source: movie.thumbnail },
			translations: [
				{
					language: "en",
					...movie.translations.en,
				},
			],
		});

		const { name, video, kind, ...extra } = madeInAbyss.extras[0];
		expect(ret!.entries.find((x) => x.kind === "extra")).toMatchObject({
			...extra,
			extraKind: kind,
			translations: [
				{
					language: "extra",
					name,
				},
			],
		});
	});
});
