import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { createMovie, createSerie } from "tests/helpers";
import { expectStatus } from "tests/utils";
import { defaultBlurhash, processImages } from "~/controllers/seed/images";
import { db } from "~/db";
import { images, shows, staff, studios, videos } from "~/db/schema";
import { dune, madeInAbyss } from "~/models/examples";

describe("images", () => {
	beforeAll(async () => {
		await db.delete(shows);
		await db.delete(studios);
		await db.delete(staff);
		await db.delete(videos);
		await db.delete(images);
	});

	it("Create a serie download images", async () => {
		await createSerie(madeInAbyss);
		const release = await processImages(true);
		// remove notifications to prevent other images to be downloaded (do not curl 20000 images for nothing)
		release();

		const ret = await db.query.shows.findFirst({
			where: eq(shows.slug, madeInAbyss.slug),
		});
		expect(ret!.slug).toBe(madeInAbyss.slug);
		expect(ret.original.poster!.blurhash).toBeString();
		expect(ret.original.poster!.blurhash).not.toBe(defaultBlurhash);
	});

	it("Download 404 image", async () => {
		const url404 = "https://mockhttp.org/status/404";
		const [ret, body] = await createMovie({
			...dune,
			translations: {
				en: {
					...dune.translations.en,
					poster: url404,
					thumbnail: null,
					banner: null,
					logo: null,
				},
			},
		});
		expectStatus(ret, body).toBe(201);

		const release = await processImages(true);
		// remove notifications to prevent other images to be downloaded (do not curl 20000 images for nothing)
		release();

		const failed = await db.query.images.findFirst({
			where: eq(images.url, url404),
		});
		expect(failed!.attempt).toBe(5);
	});
});
