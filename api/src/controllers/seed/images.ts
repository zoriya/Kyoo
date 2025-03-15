import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { encode } from "blurhash";
import { eq, sql } from "drizzle-orm";
import { version } from "package.json";
import type { PoolClient } from "pg";
import sharp from "sharp";
import { db } from "~/db";
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

// this will only push a task to the image downloader service and not download it instantly.
// this is both done to prevent to many requests to be sent at once and to make sure POST
// requests are not blocked by image downloading or blurhash calculation
export const enqueueImage = async (
	tx: typeof db,
	url: string,
): Promise<Image> => {
	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(url);
	const id = hasher.digest().toString("hex");

	await tx.insert(mqueue).values({ kind: "image", message: { id, url } });

	return {
		id,
		source: url,
		blurhash: "",
	};
};

export const enqueueOptImage = async (
	tx: typeof db,
	url: string | null,
): Promise<Image | null> => {
	if (!url) return null;
	return await enqueueImage(tx, url);
};

export const processImages = async () => {
	await db.transaction(async (tx) => {
		const [item] = await tx
			.select()
			.from(mqueue)
			.for("update", { skipLocked: true })
			.where(eq(mqueue.kind, "image"))
			.orderBy(mqueue.createdAt)
			.limit(1);

		const img = item.message as ImageTask;
		const blurhash = await downloadImage(img.id, img.url);

		const table = schema[img.table as keyof typeof schema] as any;

		await tx
			.update(table)
			.set({
				[img.column]: { id: img.id, source: img.url, blurhash } satisfies Image,
			})
			.where(eq(sql`${table[img.column]}->'id'`, img.id));

		await tx.delete(mqueue).where(eq(mqueue.id, item.id));
	});

	const client = (await db.$client.connect()) as PoolClient;
	client.on("notification", (evt) => {
		if (evt.channel !== "image") return;
	});
};

async function downloadImage(id: string, url: string): Promise<string> {
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
