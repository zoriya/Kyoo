import { stat } from "node:fs/promises";
import type { BunFile } from "bun";
import { and, eq, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "~/db";
import { showTranslations, shows } from "~/db/schema";
import { sqlarr } from "~/db/utils";
import { KError } from "~/models/error";
import { bubble } from "~/models/examples";
import { AcceptLanguage, isUuid, processLanguages } from "~/models/utils";
import { imageDir } from "./seed/images";

export const imagesH = new Elysia({ tags: ["images"] })
	.get(
		"/images/:id",
		async ({ params: { id }, query: { quality }, headers: reqHeaders }) => {
			const path = `${imageDir}/${id}.${quality}.jpg`;
			const file = Bun.file(path);

			const etag = await generateETag(file);
			if (await isCached(reqHeaders, etag, path))
				return new Response(null, { status: 304 });

			const [start = 0, end = Number.POSITIVE_INFINITY] =
				reqHeaders.range?.split("-").map(Number) ?? [];
			return new Response(file.slice(start, end), {
				headers: {
					Etag: etag,
					"Cache-Control": `public, max-age=${3 * 60 * 60}`,
				},
			}) as any;
		},
		{
			detail: { description: "Access an image by id." },
			params: t.Object({
				id: t.String({
					desription: "Id of the image to retrive.",
					format: "regex",
					pattern: "^[0-9a-fA-F]*$",
				}),
			}),
			query: t.Object({
				quality: t.Optional(
					t.UnionEnum(["high", "medium", "low"], {
						default: "high",
						description: "The quality you want your image to be in.",
					}),
				),
			}),
			response: {
				200: t.File({ description: "The whole image" }),
				206: t.File({ description: "Only the range of the image requested" }),
				304: t.Void({ description: "Cached image already up-to-date" }),
				404: { ...KError, description: "No image found with this id." },
			},
		},
	)
	.get(
		"/movies/:id/poster",
		async ({
			params: { id },
			headers: { "accept-language": languages },
			query: { quality },
			set,
			error,
			redirect,
		}) => {
			const lang = processLanguages(languages);
			const [movie] = await db
				.select({
					poster: showTranslations.poster,
					language: showTranslations.language,
				})
				.from(shows)
				.leftJoin(showTranslations, eq(shows.pk, showTranslations.pk))
				.where(
					and(
						eq(shows.kind, "movie"),
						isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
						!lang.includes("*")
							? eq(showTranslations.language, sql`any(${sqlarr(lang)})`)
							: undefined,
					),
				)
				.orderBy(
					sql`array_position(${sqlarr(lang)}, ${showTranslations.language})`,
				)
				.limit(1);

			if (!movie) {
				return error(404, {
					status: 404,
					message: `No movie found with id or slug: '${id}'.`,
				});
			}
			if (!movie.language) {
				return error(422, {
					status: 422,
					message: "Accept-Language header could not be satisfied.",
				});
			}
			set.headers["content-language"] = movie.language;
			return redirect(`/images/${movie.poster!.id}?quality=${quality}`);
		},
		{
			detail: { description: "Get the poster of a movie" },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the movie to retrieve.",
					example: bubble.slug,
				}),
			}),
			query: t.Object({
				quality: t.Optional(
					t.UnionEnum(["high", "medium", "low"], {
						default: "high",
						description: "The quality you want your image to be in.",
					}),
				),
			}),
			headers: t.Object({
				"accept-language": AcceptLanguage(),
			}),
			response: {
				302: t.Void({
					description:
						"Redirected to the [/movies/{id}](#tag/movies/GET/movies/{id}) route.",
				}),
				404: {
					...KError,
					description: "No movie found with the given id or slug.",
				},
				422: KError,
			},
		},
	);

// stolen from https://github.com/elysiajs/elysia-static/blob/main/src/cache.ts

export async function isCached(
	headers: Record<string, string | undefined>,
	etag: string,
	filePath: string,
) {
	// Always return stale when Cache-Control: no-cache
	// to support end-to-end reload requests
	// https://tools.ietf.org/html/rfc2616#section-14.9.4
	if (
		headers["cache-control"] &&
		headers["cache-control"].indexOf("no-cache") !== -1
	)
		return false;

	// if-none-match
	if ("if-none-match" in headers) {
		const ifNoneMatch = headers["if-none-match"];

		if (ifNoneMatch === "*") return true;

		if (ifNoneMatch === null) return false;

		if (typeof etag !== "string") return false;

		const isMatching = ifNoneMatch === etag;

		if (isMatching) return true;

		/**
		 * A recipient MUST ignore If-Modified-Since if the request contains an
		 * If-None-Match header field; the condition in If-None-Match is considered
		 * to be a more accurate replacement for the condition in If-Modified-Since,
		 * and the two are only combined for the sake of interoperating with older
		 * intermediaries that might not implement If-None-Match.
		 *
		 * @see RFC 9110 section 13.1.3
		 */
		return false;
	}

	// if-modified-since
	if (headers["if-modified-since"]) {
		const ifModifiedSince = headers["if-modified-since"];
		let lastModified: Date | undefined;
		try {
			lastModified = (await stat(filePath)).mtime;
		} catch {
			/* empty */
		}

		if (
			lastModified !== undefined &&
			lastModified.getTime() <= Date.parse(ifModifiedSince)
		)
			return true;
	}

	return false;
}

export async function generateETag(file: BunFile) {
	const hash = new Bun.CryptoHasher("md5");
	hash.update(await file.arrayBuffer());

	return hash.digest("base64");
}
