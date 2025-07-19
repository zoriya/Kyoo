import type { Stats } from "node:fs";
import type { S3Stats } from "bun";
import { and, eq, type SQL, sql } from "drizzle-orm";
import Elysia, { type Context, t } from "elysia";
import { prefix } from "~/base";
import { db } from "~/db";
import {
	shows,
	showTranslations,
	staff,
	studios,
	studioTranslations,
} from "~/db/schema";
import { sqlarr } from "~/db/utils";
import { KError } from "~/models/error";
import { bubble } from "~/models/examples";
import { AcceptLanguage, isUuid, processLanguages } from "~/models/utils";
import { comment, getFile } from "~/utils";
import { imageDir } from "./seed/images";

function getRedirectToImageHandler({ filter }: { filter?: SQL }) {
	return async function Handler({
		params: { id, image },
		headers: { "accept-language": languages },
		query: { quality },
		set,
		status,
		redirect,
	}: {
		params: { id: string; image: "poster" | "thumbnail" | "banner" | "logo" };
		headers: { "accept-language": string };
		query: { quality: "high" | "medium" | "low" };
		set: Context["set"];
		status: Context["status"];
		redirect: Context["redirect"];
	}) {
		id ??= "random";
		const lang = processLanguages(languages);
		const item = db.$with("item").as(
			db
				.select({ pk: shows.pk })
				.from(shows)
				.where(
					and(
						filter,
						id !== "random"
							? isUuid(id)
								? eq(shows.id, id)
								: eq(shows.slug, id)
							: undefined,
					),
				)
				.orderBy(sql`random()`)
				.limit(1),
		);
		const [ret] = await db
			.with(item)
			.select({
				image: showTranslations[image],
				language: showTranslations.language,
			})
			.from(item)
			.leftJoin(showTranslations, eq(item.pk, showTranslations.pk))
			.where(
				!lang.includes("*")
					? eq(showTranslations.language, sql`any(${sqlarr(lang)})`)
					: undefined,
			)
			.orderBy(
				sql`array_position(${sqlarr(lang)}, ${showTranslations.language})`,
			)
			.limit(1);

		if (!ret) {
			return status(404, {
				status: 404,
				message: `No item found with id or slug: '${id}'.`,
			});
		}
		if (!ret.language) {
			return status(422, {
				status: 422,
				message: "Accept-Language header could not be satisfied.",
			});
		}
		set.headers["content-language"] = ret.language;
		return quality
			? redirect(`${prefix}/images/${ret.image!.id}?quality=${quality}`)
			: redirect(`${prefix}/images/${ret.image!.id}`);
	};
}

export const imagesH = new Elysia({ tags: ["images"] })
	.get(
		"/images/:id",
		async ({
			params: { id },
			query: { quality },
			headers: reqHeaders,
			status,
		}) => {
			const path = `${imageDir}/${id}.${quality}.jpg`;
			const file = getFile(path);

			const stat = await file.stat().catch(() => undefined);
			if (!stat) {
				return status(404, {
					status: 404,
					message: comment`
						No image available with this ID.
						Either the id is invalid or the image has not been downloaded yet.
					`,
				});
			}
			const etag =
				"etag" in stat
					? stat.etag
					: Buffer.from(stat.mtime.toISOString(), "utf8").toString("base64");

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
	.guard({
		query: t.Object({
			quality: t.Optional(
				t.UnionEnum(["high", "medium", "low"], {
					default: "high",
					description: "The quality you want your image to be in.",
				}),
			),
		}),
		response: {
			302: t.Void({
				description:
					"Redirected to the [/images/{id}](#tag/images/get/api/images/{id}) route.",
			}),
			404: {
				...KError,
				description: "No item found with the given id or slug.",
			},
			422: KError,
		},
	})
	.get(
		"/staff/:id/image",
		async ({ params: { id }, query: { quality }, status, redirect }) => {
			const [ret] = await db
				.select({ image: staff.image })
				.from(staff)
				.where(
					id !== "random"
						? isUuid(id)
							? eq(shows.id, id)
							: eq(shows.slug, id)
						: undefined,
				)
				.orderBy(sql`random()`)
				.limit(1);

			if (!ret) {
				return status(404, {
					status: 404,
					message: `No staff member found with id or slug: '${id}'.`,
				});
			}
			return quality
				? redirect(`${prefix}/images/${ret.image!.id}?quality=${quality}`)
				: redirect(`${prefix}/images/${ret.image!.id}`);
		},
		{
			detail: { description: "Get the image of a staff member." },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the staff member.",
					example: bubble.slug,
				}),
			}),
		},
	)
	.guard({
		headers: t.Object(
			{
				"accept-language": AcceptLanguage(),
			},
			{ additionalProperties: true },
		),
	})
	.get(
		"/studios/:id/logo",
		async ({
			params: { id },
			headers: { "accept-language": languages },
			query: { quality },
			set,
			status,
			redirect,
		}) => {
			const lang = processLanguages(languages);
			const item = db.$with("item").as(
				db
					.select({ pk: studios.pk })
					.from(studios)
					.where(
						id !== "random"
							? isUuid(id)
								? eq(studios.id, id)
								: eq(studios.slug, id)
							: undefined,
					)
					.orderBy(sql`random()`)
					.limit(1),
			);
			const [ret] = await db
				.with(item)
				.select({
					image: studioTranslations.logo,
					language: studioTranslations.language,
				})
				.from(item)
				.leftJoin(studioTranslations, eq(item.pk, studioTranslations.pk))
				.where(
					!lang.includes("*")
						? eq(studioTranslations.language, sql`any(${sqlarr(lang)})`)
						: undefined,
				)
				.orderBy(
					sql`array_position(${sqlarr(lang)}, ${studioTranslations.language})`,
				)
				.limit(1);

			if (!ret) {
				return status(404, {
					status: 404,
					message: `No studio found with id or slug: '${id}'.`,
				});
			}
			if (!ret.language) {
				return status(422, {
					status: 422,
					message: "Accept-Language header could not be satisfied.",
				});
			}
			set.headers["content-language"] = ret.language;
			return quality
				? redirect(`${prefix}/images/${ret.image!.id}?quality=${quality}`)
				: redirect(`${prefix}/images/${ret.image!.id}`);
		},
		{
			detail: { description: "Get the logo of a studio." },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the studio.",
					example: bubble.slug,
				}),
			}),
		},
	)
	.get("/shows/random/:image", getRedirectToImageHandler({}), {
		detail: { description: "Get the specified image of a random show." },
		params: t.Object({
			image: t.UnionEnum(["poster", "thumbnail", "logo", "banner"], {
				description: "The type of image to retrive.",
			}),
		}),
	})
	.guard({
		params: t.Object({
			id: t.String({
				description: "The id or slug of the item to retrieve.",
				example: bubble.slug,
			}),
			image: t.UnionEnum(["poster", "thumbnail", "logo", "banner"], {
				description: "The type of image to retrive.",
			}),
		}),
	})
	.get(
		"/movies/:id/:image",
		getRedirectToImageHandler({
			filter: eq(shows.kind, "movie"),
		}),
		{
			detail: { description: "Get the specified image of a movie" },
		},
	)
	.get(
		"/series/:id/:image",
		getRedirectToImageHandler({
			filter: eq(shows.kind, "serie"),
		}),
		{
			detail: { description: "Get the specified image of a serie" },
		},
	)
	.get(
		"/collections/:id/:image",
		getRedirectToImageHandler({
			filter: eq(shows.kind, "collection"),
		}),
		{
			detail: { description: "Get the specified image of a collection" },
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
		const stat = await getFile(filePath).stat();
		try {
			if ((stat as S3Stats).lastModified) {
				lastModified = (stat as S3Stats).lastModified;
			} else if ((stat as Stats).mtime) {
				lastModified = (stat as Stats).mtime;
			}
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
