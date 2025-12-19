import path from "node:path";
import { getCurrentSpan, setAttributes } from "@elysiajs/opentelemetry";
import { getLogger } from "@logtape/logtape";
import { SpanStatusCode } from "@opentelemetry/api";
import { encode } from "blurhash";
import { and, eq, is, lt, type SQL, sql } from "drizzle-orm";
import { PgColumn, type PgTable } from "drizzle-orm/pg-core";
import { version } from "package.json";
import type { PoolClient } from "pg";
import sharp from "sharp";
import { db, type Transaction } from "~/db";
import { mqueue } from "~/db/schema/mqueue";
import { unnestValues } from "~/db/utils";
import type { Image } from "~/models/utils";
import { record } from "~/otel";
import { getFile } from "~/utils";

const logger = getLogger();

export const imageDir = process.env.IMAGES_PATH ?? "/images";
export const defaultBlurhash = "000000";

export type ImageTask = {
	id: string;
	url: string;
	table: string;
	column: string;
};

// this will only push a task to the image downloader service and not download it instantly.
// this is both done to prevent too many requests to be sent at once and to make sure POST
// requests are not blocked by image downloading or blurhash calculation
export const enqueueOptImage = (
	imgQueue: ImageTask[],
	img:
		| { url?: string | null; column: PgColumn }
		| { url?: string | null; table: PgTable; column: SQL },
): Image | null => {
	if (!img.url) return null;

	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(img.url);
	const id = hasher.digest().toString("hex");

	const cleanupColumn = (column: SQL) =>
		// @ts-expect-error dialect is private
		db.dialect.sqlToQuery(
			sql.join(
				column.queryChunks.map((x) => {
					if (is(x, PgColumn)) {
						return sql.identifier(x.name);
					}
					return x;
				}),
			),
		).sql;

	const message: ImageTask =
		"table" in img
			? {
					id,
					url: img.url,
					// @ts-expect-error dialect is private
					table: db.dialect.sqlToQuery(sql`${img.table}`).sql,
					column: cleanupColumn(img.column),
				}
			: {
					id,
					url: img.url,
					// @ts-expect-error dialect is private
					table: db.dialect.sqlToQuery(sql`${img.column.table}`).sql,
					column: sql.identifier(img.column.name).value,
				};

	imgQueue.push(message);

	return {
		id,
		source: img.url,
		blurhash: defaultBlurhash,
	};
};

export const flushImageQueue = record(
	"enqueueImages",
	async (tx: Transaction, imgQueue: ImageTask[], priority: number) => {
		if (!imgQueue.length) return;
		await tx.insert(mqueue).select(
			unnestValues(
				imgQueue.map((x) => ({ kind: "image", message: x, priority })),
				mqueue,
			),
		);
		await tx.execute(sql`notify kyoo_image`);
	},
);

export const processImages = record(
	"processImages",
	async (waitToFinish = false) => {
		let running = false;
		async function processAll() {
			if (running) return;
			running = true;

			let found = true;
			while (found) {
				// run 10 downloads at the same time,
				const founds = await Promise.all([...new Array(10)].map(processOne));
				// continue as long as there's one found (if it failed we wanna retry)
				found = founds.includes(true);
			}
			running = false;
		}

		const client = (await db.$client.connect()) as PoolClient;
		client.on("notification", (evt) => {
			if (evt.channel !== "kyoo_image") return;
			try {
				processAll();
			} catch (e) {
				logger.error(
					"Failed to process images. Aborting images downloading. error={error}",
					{
						error: e,
					},
				);
			}
		});
		await client.query("listen kyoo_image");

		if (waitToFinish) {
			// start processing old tasks
			await processAll();
		} else {
			processAll();
		}
		return () => client.release(true);
	},
);

const processOne = record("download", async () => {
	return await db.transaction(async (tx) => {
		const [item] = await tx
			.select()
			.from(mqueue)
			.for("update", { skipLocked: true })
			.where(and(eq(mqueue.kind, "image"), lt(mqueue.attempt, 5)))
			.orderBy(mqueue.priority, mqueue.attempt, mqueue.createdAt)
			.limit(1);

		if (!item) return false;

		const img = item.message as ImageTask;
		setAttributes({ "item.url": img.url });
		try {
			const blurhash = await downloadImage(img.id, img.url);
			const ret: Image = { id: img.id, source: img.url, blurhash };

			const table = sql.raw(img.table);
			const column = sql.raw(img.column);

			await tx.execute(sql`
				update ${table} set ${column} = ${ret}
				where ${column}->'id' = to_jsonb(${img.id}::text)
			`);

			await tx.delete(mqueue).where(eq(mqueue.id, item.id));
		} catch (err: any) {
			const span = getCurrentSpan();
			if (span) {
				span.recordException(err);
				span.setStatus({ code: SpanStatusCode.ERROR });
			}
			logger.error("Failed to download image. imageurl={url}, error={error}", {
				url: img.url,
				error: err,
			});
			await tx
				.update(mqueue)
				.set({ attempt: sql`${mqueue.attempt}+1` })
				.where(eq(mqueue.id, item.id));
		}
		return true;
	});
});

async function downloadImage(id: string, url: string): Promise<string> {
	const low = await getFile(path.join(imageDir, `${id}.low.jpg`))
		.arrayBuffer()
		.catch(() => false as const);
	if (low) {
		return await getBlurhash(sharp(low));
	}

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
			const file = getFile(path.join(imageDir, `${id}.${resolution}.jpg`));

			await Bun.write(file, buffer, { mode: 0o660 });
		}),
	);
	return await getBlurhash(image);
}

async function getBlurhash(image: sharp.Sharp): Promise<string> {
	const { data, info } = await image
		.resize(32, 32, { fit: "inside" })
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
}
