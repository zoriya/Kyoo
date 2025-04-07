import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { defaultBlurhash, processImages } from "~/controllers/seed/images";
import { db } from "~/db";
import { mqueue, shows, staff, studios, videos } from "~/db/schema";
import { madeInAbyss } from "~/models/examples";
import { createSerie } from "../helpers";

describe("images", () => {
	it("Create a serie download images", async () => {
		await db.delete(shows);
		await db.delete(studios);
		await db.delete(staff);
		await db.delete(videos);
		await db.delete(mqueue);

		await createSerie(madeInAbyss);
		const release = await processImages();
		// remove notifications to prevent other images to be downloaded (do not curl 20000 images for nothing)
		release();

		const ret = await db.query.shows.findFirst({
			where: eq(shows.slug, madeInAbyss.slug),
		});
		expect(ret!.slug).toBe(madeInAbyss.slug);
		expect(ret!.original.poster!.blurhash).toBeString();
		expect(ret!.original.poster!.blurhash).not.toBe(defaultBlurhash);
	});
});
