import { eq, sql } from "drizzle-orm";
import { version } from "package.json";
import type { PoolClient } from "pg";
import { db } from "~/db";
import * as schema from "~/db/schema";
import { mqueue } from "~/db/schema/queue";
import type { Image } from "~/models/utils";

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
		await fetch(img.url, { headers: { "User-Agent": `Kyoo v${version}` }, });
		const blurhash = "";

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
