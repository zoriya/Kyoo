import { and, eq, gt, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Elysia, t } from "elysia";
import { auth } from "~/auth";
import { db, type Transaction } from "~/db";
import { entries, entryVideoJoin, shows, videos } from "~/db/schema";
import { sqlarr, unnest } from "~/db/utils";
import { bubble } from "~/models/examples";
import { isUuid } from "~/models/utils";
import { SeedVideo } from "~/models/video";
import { computeVideoSlug } from "./insert/entries";
import { updateAvailableCount, updateAvailableSince } from "./insert/shows";

const LinkReq = t.Array(
	t.Object({
		id: t.String({
			description: "Id of the video",
			format: "uuid",
		}),
		for: t.Array(SeedVideo.properties.for.items),
	}),
);
type LinkReq = typeof LinkReq.static;

const LinkRet = t.Array(
	t.Object({
		id: t.String({ format: "uuid" }),
		path: t.String({ examples: ["/video/made in abyss s1e13.mkv"] }),
		entries: t.Array(
			t.Object({
				slug: t.String({
					format: "slug",
					examples: ["made-in-abyss-s1e13"],
				}),
			}),
		),
	}),
);
type LinkRet = typeof LinkRet.static;

async function mapBody(tx: Transaction, body: LinkReq) {
	const vids = await tx
		.select({ pk: videos.pk, id: videos.id, path: videos.path })
		.from(videos)
		.where(eq(videos.id, sql`any(${sqlarr(body.map((x) => x.id))})`));
	const mapped = body.flatMap((x) =>
		x.for.map((e) => ({
			video: vids.find((v) => v.id === x.id)!.pk,
			entry: {
				...e,
				movie:
					"movie" in e
						? isUuid(e.movie)
							? { id: e.movie }
							: { slug: e.movie }
						: undefined,
				serie:
					"serie" in e
						? isUuid(e.serie)
							? { id: e.serie }
							: { slug: e.serie }
						: undefined,
			},
		})),
	);
	return [vids, mapped] as const;
}

export async function linkVideos(
	tx: Transaction,
	links: {
		video: number;
		entry: Omit<SeedVideo["for"], "movie" | "serie"> & {
			movie?: { id?: string; slug?: string };
			serie?: { id?: string; slug?: string };
		};
	}[],
) {
	if (!links.length) return {};

	const entriesQ = tx
		.select({
			pk: entries.pk,
			id: entries.id,
			slug: entries.slug,
			kind: entries.kind,
			seasonNumber: entries.seasonNumber,
			episodeNumber: entries.episodeNumber,
			order: entries.order,
			showId: sql`${shows.id}`.as("showId"),
			showSlug: sql`${shows.slug}`.as("showSlug"),
			externalId: entries.externalId,
		})
		.from(entries)
		.innerJoin(shows, eq(entries.showPk, shows.pk))
		.as("entriesQ");

	const renderVid = alias(videos, "renderVid");
	const hasRenderingQ = or(
		gt(
			sql`dense_rank() over (partition by ${entriesQ.pk} order by ${videos.rendering})`,
			1,
		),
		sql`exists(${tx
			.select()
			.from(entryVideoJoin)
			.innerJoin(renderVid, eq(renderVid.pk, entryVideoJoin.videoPk))
			.where(
				and(
					eq(entryVideoJoin.entryPk, entriesQ.pk),
					ne(renderVid.rendering, videos.rendering),
				),
			)})`,
	)!;

	const ret = await tx
		.insert(entryVideoJoin)
		.select(
			tx
				.selectDistinctOn([entriesQ.pk, videos.pk], {
					entryPk: entriesQ.pk,
					videoPk: videos.pk,
					slug: computeVideoSlug(entriesQ.slug, hasRenderingQ),
				})
				.from(
					unnest(links, "j", {
						video: "integer",
						entry: "jsonb",
					}),
				)
				.innerJoin(videos, eq(videos.pk, sql`j.video`))
				.innerJoin(
					entriesQ,
					or(
						and(
							sql`j.entry ? 'slug'`,
							eq(entriesQ.slug, sql`j.entry->>'slug'`),
						),
						and(
							sql`j.entry ? 'movie'`,
							or(
								eq(entriesQ.showId, sql`(j.entry #>> '{movie, id}')::uuid`),
								eq(entriesQ.showSlug, sql`j.entry #>> '{movie, slug}'`),
							),
							eq(entriesQ.kind, "movie"),
						),
						and(
							sql`j.entry ? 'serie'`,
							or(
								eq(entriesQ.showId, sql`(j.entry #>> '{serie, id}')::uuid`),
								eq(entriesQ.showSlug, sql`j.entry #>> '{serie, slug}'`),
							),
							or(
								and(
									sql`j.entry ?& array['season', 'episode']`,
									eq(entriesQ.seasonNumber, sql`(j.entry->>'season')::integer`),
									eq(
										entriesQ.episodeNumber,
										sql`(j.entry->>'episode')::integer`,
									),
								),
								and(
									sql`j.entry ? 'order'`,
									eq(entriesQ.order, sql`(j.entry->>'order')::float`),
								),
								and(
									sql`j.entry ? 'special'`,
									eq(
										entriesQ.episodeNumber,
										sql`(j.entry->>'special')::integer`,
									),
									eq(entriesQ.kind, "special"),
								),
							),
						),
						and(
							sql`j.entry ? 'externalId'`,
							sql`j.entry->'externalId' <@ ${entriesQ.externalId}`,
						),
					),
				),
		)
		.onConflictDoUpdate({
			target: [entryVideoJoin.entryPk, entryVideoJoin.videoPk],
			// this is basically a `.onConflictDoNothing()` but we want `returning` to give us the existing data
			set: { entryPk: sql`excluded.entry_pk` },
		})
		.returning({
			slug: entryVideoJoin.slug,
			entryPk: entryVideoJoin.entryPk,
			videoPk: entryVideoJoin.videoPk,
		});

	const entr = ret.reduce(
		(acc, x) => {
			acc[x.videoPk] ??= [];
			acc[x.videoPk].push({ slug: x.slug });
			return acc;
		},
		{} as Record<number, { slug: string }[]>,
	);

	const entriesPk = [...new Set(ret.map((x) => x.entryPk))];
	await updateAvailableCount(
		tx,
		tx
			.selectDistinct({ pk: entries.showPk })
			.from(entries)
			.where(eq(entries.pk, sql`any(${sqlarr(entriesPk)})`)),
	);
	await updateAvailableSince(tx, entriesPk);

	return entr;
}

export const videoLinkH = new Elysia({ prefix: "/videos", tags: ["videos"] })
	.use(auth)
	.post(
		"/link",
		async ({ body, status }) => {
			return await db.transaction(async (tx) => {
				const [vids, mapped] = await mapBody(tx, body);
				const links = await linkVideos(tx, mapped);
				return status(
					201,
					vids.map((x) => ({
						id: x.id,
						path: x.path,
						entries: links[x.pk] ?? [],
					})),
				);
			});
		},
		{
			detail: {
				description: "Link existing videos to existing entries",
			},
			body: LinkReq,
			response: {
				201: LinkRet,
			},
		},
	)
	.put(
		"/link",
		async ({ body, status }) => {
			return await db.transaction(async (tx) => {
				const [vids, mapped] = await mapBody(tx, body);
				await tx
					.delete(entryVideoJoin)
					.where(
						eq(
							entryVideoJoin.videoPk,
							sql`any(${sqlarr(vids.map((x) => x.pk))})`,
						),
					);
				const links = await linkVideos(tx, mapped);

				return status(
					201,
					vids.map((x) => ({
						id: x.id,
						path: x.path,
						entries: links[x.pk] ?? [],
					})),
				);
			});
		},
		{
			detail: {
				description:
					"Override all links between the specified videos and entries.",
			},
			body: LinkReq,
			response: {
				201: LinkRet,
			},
		},
	)
	.delete(
		"/link",
		async ({ body }) => {
			return await db.transaction(async (tx) => {
				const ret = await tx
					.delete(entryVideoJoin)
					.where(eq(entryVideoJoin.slug, sql`any(${sqlarr(body)})`))
					.returning({
						slug: entryVideoJoin.slug,
						entryPk: entryVideoJoin.entryPk,
					});

				const entriesPk = [...new Set(ret.map((x) => x.entryPk))];
				await updateAvailableCount(
					tx,
					tx
						.selectDistinct({ pk: entries.showPk })
						.from(entries)
						.where(eq(entries.pk, sql`any(${sqlarr(entriesPk)})`)),
				);
				await updateAvailableSince(tx, entriesPk);

				return ret.map((x) => x.slug);
			});
		},
		{
			detail: {
				description: "Delete links between an entry and a video by their slug",
			},
			body: t.Array(t.String({ format: "slug", examples: [bubble.slug] })),
			response: {
				200: t.Array(t.String({ format: "slug", examples: [bubble.slug] })),
			},
		},
	);
