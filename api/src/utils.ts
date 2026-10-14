import type { BunFile, S3File } from "bun";

// remove indent in multi-line comments
export const comment = (str: TemplateStringsArray, ...values: any[]) =>
	str
		.reduce((acc, str, i) => `${acc}${values[i - 1]}${str}`)
		.replace(/(^\s)|(\s+$)/g, "") // first & last whitespaces
		.replace(/^[ \t]+/gm, "") // leading spaces
		.replace(/([^\n])\n([^\n])/g, "$1 $2") // two lines to space separated line
		.replace(/\n{2}/g, "\n"); // keep newline if there's an empty line

export function getYear(date: string) {
	return new Date(date).getUTCFullYear();
}

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

// Returns either a filesystem-backed file, or a S3-backed file,
// depending on whether or not S3 environment variables are set.
export function isS3Enabled(): boolean {
	return "S3_BUCKET" in process.env || "AWS_BUCKET" in process.env;
}

function toS3Key(path: string): string {
	// S3 keys must not start with "/". IMAGES_PATH defaults to "/images",
	// so strip the leading slash to get a stable key like "images/<id>.jpg".
	return path.replace(/^\/+/, "");
}

export function getFile(path: string): BunFile | S3File {
	if (isS3Enabled()) {
		// This will use a S3 client configured via environment variables.
		// See https://bun.sh/docs/api/s3#credentials for more details.
		return Bun.s3.file(toS3Key(path));
	}

	return Bun.file(path);
}

// Atomically write contents to path.
// S3 PUTs are whole-object writes (readers see old or new, never partial).
// Local writes go through tmp-file+rename in the same directory so concurrent
// replicas never observe torn files (Bun.write truncates in place).
export async function writeFileAtomic(
	path: string,
	data: Buffer | Uint8Array | string | ArrayBuffer | Blob,
): Promise<void> {
	const file = getFile(path);
	if (isS3Enabled()) {
		await Bun.write(file, data);
		return;
	}

	const { mkdir, rename, rm } = await import("node:fs/promises");
	const { dirname, basename } = await import("node:path");
	await mkdir(dirname(path), { recursive: true });
	const tmp = `${dirname(path)}/.${basename(path)}.${process.pid}.${Date.now()}.tmp`;
	try {
		await Bun.write(tmp, data, { mode: 0o660 });
		await rename(tmp, path);
	} catch (e) {
		await rm(tmp, { force: true }).catch(() => {});
		throw e;
	}
}

export function uniq<T>(a: T[]): T[] {
	return uniqBy(a, (x) => x as string);
}

export function uniqBy<T>(a: T[], key: (val: T) => string | number): T[] {
	const seen: Record<string, boolean> = {};
	return a.filter((item) => {
		const k = key(item);
		if (seen[k]) return false;
		seen[k] = true;
		return true;
	});
}

export function duplicates<T>(a: T[], key: (val: T) => string): T[] {
	const seen: Record<string, boolean> = {};
	return uniqBy(
		a.filter((item) => {
			const k = key(item);
			if (seen[k]) return true;
			seen[k] = true;
			return false;
		}),
		key,
	);
}

export function traverse<T extends Record<string, any>>(
	arr: T[],
): { [K in keyof T]: T[K][] } | null {
	if (arr.length === 0) return null;

	const result = {} as { [K in keyof T]: T[K][] };
	arr.forEach((obj, i) => {
		for (const key in obj) {
			if (!result[key]) {
				result[key] = new Array(i).fill(null);
			}
			result[key].push(obj[key]);
		}
	});

	return result;
}

export const toQueryStr = (query: Record<string, unknown>) => {
	const entries = Object.entries(query);
	if (entries.length === 0) return "";
	return `?${entries
		.map(([k, v]) => {
			if (!v) return null;
			const key = encodeURIComponent(k);
			if (!Array.isArray(v)) return `${key}=${encodeURIComponent(`${v}`)}`;
			if (v.length === 0) return null;
			return `${key}=${v.map((x) => encodeURIComponent(`${x}`)).join(",")}`;
		})
		.filter((x) => x)
		.join("&")}`;
};
