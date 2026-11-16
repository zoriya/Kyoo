import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import sharp from "sharp";
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
		expect(ret!.original.poster!.blurhash).toBeString();
		expect(ret!.original.poster!.blurhash).not.toBe(defaultBlurhash);
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

	it("Don't deadlock with seeding transactions", async () => {
		const jpg = await sharp({
			create: { width: 4, height: 4, channels: 3, background: "red" },
		})
			.jpeg()
			.toBuffer();
		// slow enough for the seed to wait on the image, fast enough for the worker
		// to wait on the show before postgres' deadlock detection (1s)
		const server = Bun.serve({
			port: 0,
			fetch: async () => {
				await Bun.sleep(600);
				return new Response(jpg);
			},
		});
		// unique url so the image is not already downloaded
		const url = `https://kyoo.zoriya.dev/deadlock-${crypto.randomUUID()}.jpg`;
		const [ret, body] = await createMovie({
			...dune,
			slug: "dune-deadlock",
			externalId: {},
			translations: {
				en: {
					...dune.translations.en,
					poster: url,
					thumbnail: null,
					banner: null,
					logo: null,
				},
			},
			collection: null,
			studios: [],
			staff: [],
		});
		expectStatus(ret, body).toBe(201);
		// elysia's url format doesn't allow localhost
		await db
			.update(images)
			.set({ url: `http://localhost:${server.port}/poster.jpg` })
			.where(eq(images.url, url));

		// a seeding transaction: lock the show's row then upsert its image
		const seed = await db.$client.connect();
		await seed.query("begin");
		await seed.query(
			"update kyoo.shows set runtime = runtime where slug = 'dune-deadlock'",
		);
		const worker = processImages(true);
		await Bun.sleep(200);
		await seed.query(
			`insert into kyoo.images (id, url, targets, priority)
				select id, url, '[]'::jsonb, 0 from kyoo.images where id = $1
			on conflict (id) do update set targets = images.targets || excluded.targets`,
			[new Bun.CryptoHasher("sha256").update(url).digest("hex")],
		);
		await seed.query("commit");
		seed.release();
		(await worker)();

		// the image is downloaded once the seed is done
		const release = await processImages(true);
		release();
		server.stop();
		const show = await db.query.shows.findFirst({
			where: eq(shows.slug, "dune-deadlock"),
		});
		expect(show!.original.poster!.blurhash).not.toBe(defaultBlurhash);
	});
});
