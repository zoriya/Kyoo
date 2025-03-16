import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { encode } from "blurhash";
import { eq, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { version } from "package.json";
import type { PoolClient } from "pg";
import sharp from "sharp";
import { type Transaction, db } from "~/db";
import * as schema from "~/db/schema";
import { mqueue } from "~/db/schema/queue";
import type { Image } from "~/models/utils";

export const imageDir = process.env.IMAGES_PATH ?? "/images";
await mkdir(imageDir, { recursive: true });

type ImageTask = {
	id: string;
	url: string;
	table: string;
	column: string;
};

type ImageTaskC = {
	url: string;
	column: PgColumn;
};

// this will only push a task to the image downloader service and not download it instantly.
// this is both done to prevent to many requests to be sent at once and to make sure POST
// requests are not blocked by image downloading or blurhash calculation
export const enqueueImage = async (
	tx: Transaction,
	img: ImageTaskC,
): Promise<Image> => {
	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(img.url);
	const id = hasher.digest().toString("hex");

	await tx.insert(mqueue).values({
		kind: "image",
		message: {
			id,
			url: img.url,
			table: img.column.table._.name,
			column: img.column.name,
		} satisfies ImageTask,
	});
	await tx.execute(sql`notify image`);

	return {
		id,
		source: img.url,
		blurhash: "",
	};
};

export const enqueueOptImage = async (
	tx: Transaction,
	img: { url: string | null; column: PgColumn },
): Promise<Image | null> => {
	if (!img.url) return null;
	return await enqueueImage(tx, { url: img.url, column: img.column });
};

export const processImages = async () => {
	async function processOne() {
		return await db.transaction(async (tx) => {
			const [item] = await tx
				.select()
				.from(mqueue)
				.for("update", { skipLocked: true })
				.where(eq(mqueue.kind, "image"))
				.orderBy(mqueue.createdAt)
				.limit(1);

			if (!item) return false;

			const img = item.message as ImageTask;
			const blurhash = await downloadImage(img.id, img.url);

			const table = schema[img.table as keyof typeof schema] as any;

			await tx
				.update(table)
				.set({
					[img.column]: {
						id: img.id,
						source: img.url,
						blurhash,
					} satisfies Image,
				})
				.where(eq(sql`${table[img.column]}->'id'`, img.id));

			await tx.delete(mqueue).where(eq(mqueue.id, item.id));
			return true;
		});
	}

	let running = false;
	async function processAll() {
		if (running) return;
		running = true;

		let found = true;
		while (found) {
			found = await processOne();
		}
		running = false;
	}

	const client = (await db.$client.connect()) as PoolClient;
	client.on("notification", (evt) => {
		if (evt.channel !== "image") return;
		processAll();
	});
	await client.query("listen image");

	// start processing old tasks
	await processAll();
};

async function downloadImage(id: string, url: string): Promise<string> {
	// TODO: check if file exists before downloading
	const resp = await fetch(url, {
		headers: { "User-Agent": `Kyoo v${version}` },
	});
	if (!resp.ok) {
		throw new Error(`Failed to fetch image: ${resp.status} ${resp.statusText}`);
	}
	const buf = Buffer.from(await resp.arrayBuffer());

	const image = sharp(buf);
	const metadata = await image.metadata();

	if (!metadata.width || !metadata.height) {
		throw new Error("Could not determine image dimensions");
	}
	const resolutions = {
		low: { width: 320 },
		medium: { width: 640 },
		high: { width: 1280 },
	};
	await Promise.all(
		Object.entries(resolutions).map(async ([resolution, dimensions]) => {
			const buffer = await image.clone().resize(dimensions.width).toBuffer();
			await writeFile(path.join(imageDir, `${id}.${resolution}.jpg`), buffer);
		}),
	);

	const { data, info } = await image
		.resize(32, 32, { fit: "inside" })
		.raw()
		.toBuffer({ resolveWithObject: true });

	const blurHash = encode(
		new Uint8ClampedArray(data),
		info.width,
		info.height,
		4,
		3,
	);

	return blurHash;
}
