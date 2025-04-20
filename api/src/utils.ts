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
	[K in keyof T]: Prettify<T[K]>;
} & {};

// Returns either a filesystem-backed file, or a S3-backed file,
// depending on whether or not S3 environment variables are set.
export function getFile(path: string): BunFile | S3File {
	if ("S3_BUCKET" in process.env || "AWS_BUCKET" in process.env) {
		// This will use a S3 client configured via environment variables.
		// See https://bun.sh/docs/api/s3#credentials for more details.
		return Bun.s3.file(path);
	}

	return Bun.file(path);
}
