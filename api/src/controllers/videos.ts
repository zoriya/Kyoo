import {
	and,
	desc,
	eq,
	gt,
	isNotNull,
	lt,
	max,
	min,
	ne,
	notExists,
	or,
	sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Elysia, t } from "elysia";
import { auth } from "~/auth";
import { db, type Transaction } from "~/db";
import {
	entries,
	entryVideoJoin,
	history,
	profiles,
	shows,
	showTranslations,
	videos,
} from "~/db/schema";
import { watchlist } from "~/db/schema/watchlist";
import {
	coalesce,
	conflictUpdateAllExcept,
	getColumns,
	isUniqueConstraint,
	jsonbAgg,
	jsonbBuildObject,
	jsonbObjectAgg,
	sqlarr,
	unnest,
	unnestValues,
} from "~/db/utils";
import { Entry } from "~/models/entry";
import { KError } from "~/models/error";
import { bubbleVideo } from "~/models/examples";
import { Progress } from "~/models/history";
import { Movie, type MovieStatus } from "~/models/movie";
import { Serie } from "~/models/serie";
import {
	AcceptLanguage,
	buildRelations,
	createPage,
	type Image,
	isUuid,
	keysetPaginate,
	Page,
	processLanguages,
	type Resource,
	Sort,
	sortToSql,
} from "~/models/utils";
import { desc as description } from "~/models/utils/descriptions";
import { Guess, Guesses, SeedVideo, Video } from "~/models/video";
import type { MovieWatchStatus, SerieWatchStatus } from "~/models/watchlist";
import { comment } from "~/utils";
import {
	entryProgressQ,
	entryVideosQ,
	getEntryTransQ,
	mapProgress,
} from "./entries";
import { computeVideoSlug } from "./seed/insert/entries";
import {
	updateAvailableCount,
	updateAvailableSince,
} from "./seed/insert/shows";

async function linkVideos(
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

const CreatedVideo = t.Object({
	id: t.String({ format: "uuid" }),
	path: t.String({ examples: [bubbleVideo.path] }),
	guess: t.Omit(Guess, ["history"]),
	entries: t.Array(
		t.Object({
			slug: t.String({ format: "slug", examples: ["bubble-v2"] }),
		}),
	),
});

const videoRelations = {
	slugs: () => {
		return db
			.select({
				slugs: coalesce<string[]>(
					jsonbAgg(entryVideoJoin.slug),
					sql`'[]'::jsonb`,
				).as("slugs"),
			})
			.from(entryVideoJoin)
			.where(eq(entryVideoJoin.videoPk, videos.pk))
			.as("slugs");
	},
	progress: () => {
		const query = db
			.select({
				json: jsonbBuildObject<Progress>({
					percent: history.percent,
					time: history.time,
					playedDate: history.playedDate,
					videoId: videos.id,
				}),
			})
			.from(history)
			.innerJoin(profiles, eq(history.profilePk, profiles.pk))
			.where(
				and(
					eq(profiles.id, sql.placeholder("userId")),
					eq(history.videoPk, videos.pk),
				),
			)
			.orderBy(desc(history.playedDate))
			.limit(1);
		return sql`
			(
				select coalesce(
					${query},
					'{"percent": 0, "time": 0, "playedDate": null, "videoId": null}'::jsonb
				)
				as "progress"
			)` as any;
	},
	entries: ({ languages }: { languages: string[] }) => {
		const transQ = getEntryTransQ(languages);

		return db
			.select({
				json: coalesce(
					jsonbAgg(
						jsonbBuildObject<Entry>({
							...getColumns(entries),
							...getColumns(transQ),
							number: entries.episodeNumber,
							videos: entryVideosQ.videos,
							progress: mapProgress({ aliased: false }),
						}),
					),
					sql`'[]'::jsonb`,
				).as("json"),
			})
			.from(entries)
			.innerJoin(transQ, eq(entries.pk, transQ.pk))
			.leftJoin(entryProgressQ, eq(entries.pk, entryProgressQ.entryPk))
			.crossJoinLateral(entryVideosQ)
			.innerJoin(entryVideoJoin, eq(entryVideoJoin.entryPk, entries.pk))
			.where(eq(entryVideoJoin.videoPk, videos.pk))
			.as("entries");
	},
	show: ({
		languages,
		preferOriginal,
	}: {
		languages: string[];
		preferOriginal: boolean;
	}) => {
		const transQ = db
			.selectDistinctOn([showTranslations.pk])
			.from(showTranslations)
			.orderBy(
				showTranslations.pk,
				sql`array_position(${sqlarr(languages)}, ${showTranslations.language})`,
			)
			.as("t");

		const watchStatusQ = db
			.select({
				watchStatus: jsonbBuildObject<MovieWatchStatus & SerieWatchStatus>({
					...getColumns(watchlist),
					percent: watchlist.seenCount,
				}).as("watchStatus"),
			})
			.from(watchlist)
			.leftJoin(profiles, eq(watchlist.profilePk, profiles.pk))
			.where(
				and(
					eq(profiles.id, sql.placeholder("userId")),
					eq(watchlist.showPk, shows.pk),
				),
			);

		return db
			.select({
				json: jsonbBuildObject<Serie | Movie>({
					...getColumns(shows),
					...getColumns(transQ),
					// movie columns (status is only a typescript hint)
					status: sql<MovieStatus>`${shows.status}`,
					airDate: shows.startAir,
					kind: sql<any>`${shows.kind}`,
					isAvailable: sql<boolean>`${shows.availableCount} != 0`,

					...(preferOriginal && {
						poster: sql<Image>`coalesce(nullif(${shows.original}->'poster', 'null'::jsonb), ${transQ.poster})`,
						thumbnail: sql<Image>`coalesce(nullif(${shows.original}->'thumbnail', 'null'::jsonb), ${transQ.thumbnail})`,
						banner: sql<Image>`coalesce(nullif(${shows.original}->'banner', 'null'::jsonb), ${transQ.banner})`,
						logo: sql<Image>`coalesce(nullif(${shows.original}->'logo', 'null'::jsonb), ${transQ.logo})`,
					}),
					watchStatus: sql`${watchStatusQ}`,
				}).as("json"),
			})
			.from(shows)
			.innerJoin(transQ, eq(shows.pk, transQ.pk))
			.where(
				eq(
					shows.pk,
					db
						.select({ pk: entries.showPk })
						.from(entries)
						.innerJoin(entryVideoJoin, eq(entryVideoJoin.entryPk, entries.pk))
						.where(eq(videos.pk, entryVideoJoin.videoPk)),
				),
			)
			.as("show");
	},
	previous: ({ languages }: { languages: string[] }) => {
		return getNextVideoEntry({ languages, prev: true });
	},
	next: getNextVideoEntry,
};

function getNextVideoEntry({
	languages,
	prev = false,
}: {
	languages: string[];
	prev?: boolean;
}) {
	const transQ = getEntryTransQ(languages);

	// tables we use two times in the query bellow
	const vids = alias(videos, `vid_${prev ? "prev" : "next"}`);
	const entr = alias(entries, `entr_${prev ? "prev" : "next"}`);
	const evj = alias(entryVideoJoin, `evj_${prev ? "prev" : "next"}`);
	return db
		.select({
			json: jsonbBuildObject<{ video: string; entry: Entry }>({
				video: entryVideoJoin.slug,
				entry: {
					...getColumns(entries),
					...getColumns(transQ),
					number: entries.episodeNumber,
					videos: entryVideosQ.videos,
					progress: mapProgress({ aliased: false }),
				},
			}).as("json"),
		})
		.from(entries)
		.innerJoin(transQ, eq(entries.pk, transQ.pk))
		.leftJoin(entryProgressQ, eq(entries.pk, entryProgressQ.entryPk))
		.crossJoinLateral(entryVideosQ)
		.leftJoin(entryVideoJoin, eq(entries.pk, entryVideoJoin.entryPk))
		.innerJoin(vids, eq(vids.pk, entryVideoJoin.videoPk))
		.where(
			and(
				// either way it needs to be of the same show
				eq(
					entries.showPk,
					db
						.select({ showPk: entr.showPk })
						.from(entr)
						.innerJoin(evj, eq(evj.entryPk, entr.pk))
						.where(eq(evj.videoPk, videos.pk))
						.limit(1),
				),
				or(
					// either the next entry
					(prev ? lt : gt)(
						entries.order,
						db
							.select({ order: (prev ? min : max)(entr.order) })
							.from(entr)
							.innerJoin(evj, eq(evj.entryPk, entr.pk))
							.where(eq(evj.videoPk, videos.pk)),
					),
					// or the second part of the current entry
					and(
						isNotNull(videos.part),
						eq(vids.rendering, videos.rendering),
						eq(vids.part, sql`${videos.part} ${sql.raw(prev ? "-" : "+")} 1`),
					),
				),
			),
		)
		.orderBy(
			prev ? desc(entries.order) : entries.order,
			// prefer next part of the current entry over next entry
			eq(vids.rendering, videos.rendering),
			// take the first part available
			vids.part,
			// always prefer latest version of video
			desc(vids.version),
		)
		.limit(1)
		.as("next");
}

export const videosReadH = new Elysia({ prefix: "/videos", tags: ["videos"] })
	.model({
		video: Video,
		error: t.Object({}),
	})
	.use(auth)
	.get(
		":id",
		async ({
			params: { id },
			query: { with: relations, preferOriginal },
			headers: { "accept-language": langs },
			jwt: { sub, settings },
			status,
		}) => {
			const languages = processLanguages(langs);

			// make an alias so entry video join is not usable on subqueries
			const evj = alias(entryVideoJoin, "evj");

			const [video] = await db
				.select({
					...getColumns(videos),
					...buildRelations(
						["slugs", "progress", "entries", ...relations],
						videoRelations,
						{
							languages,
							preferOriginal: preferOriginal ?? settings.preferOriginal,
						},
					),
				})
				.from(videos)
				.leftJoin(evj, eq(videos.pk, evj.videoPk))
				.where(isUuid(id) ? eq(videos.id, id) : eq(evj.slug, id))
				.limit(1)
				.execute({ userId: sub });
			if (!video) {
				return status(404, {
					status: 404,
					message: `No video found with id or slug '${id}'`,
				});
			}
			return video as any;
		},
		{
			detail: {
				description: "Get a video & it's related entries",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the video to retrieve.",
					example: "made-in-abyss-s1e13",
				}),
			}),
			query: t.Object({
				with: t.Array(t.UnionEnum(["previous", "next", "show"]), {
					default: [],
					description: "Include related entries in the response.",
				}),
				preferOriginal: t.Optional(
					t.Boolean({
						description: description.preferOriginal,
					}),
				),
			}),
			headers: t.Object({
				"accept-language": AcceptLanguage(),
			}),
			response: {
				200: t.Composite([
					Video,
					t.Object({
						slugs: t.Array(
							t.String({ format: "slug", examples: ["made-in-abyss-s1e13"] }),
						),
						progress: Progress,
						entries: t.Array(Entry),
						previous: t.Optional(
							t.Nullable(
								t.Object({
									video: t.String({
										format: "slug",
										examples: ["made-in-abyss-s1e12"],
									}),
									entry: Entry,
								}),
							),
						),
						next: t.Optional(
							t.Nullable(
								t.Object({
									video: t.String({
										format: "slug",
										examples: ["made-in-abyss-dawn-of-the-deep-soul"],
									}),
									entry: Entry,
								}),
							),
						),
						show: t.Optional(
							t.Union([
								t.Composite([t.Object({ kind: t.Literal("movie") }), Movie]),
								t.Composite([t.Object({ kind: t.Literal("serie") }), Serie]),
							]),
						),
					}),
				]),
				404: {
					...KError,
					description: "No video found with the given id or slug.",
				},
				422: KError,
			},
		},
	)
	.get(
		":id/info",
		async ({ params: { id }, status, redirect }) => {
			const [video] = await db
				.select({
					path: videos.path,
				})
				.from(videos)
				.leftJoin(entryVideoJoin, eq(videos.pk, entryVideoJoin.videoPk))
				.where(isUuid(id) ? eq(videos.id, id) : eq(entryVideoJoin.slug, id))
				.limit(1);

			if (!video) {
				return status(404, {
					status: 404,
					message: `No video found with id or slug '${id}'`,
				});
			}
			const path = Buffer.from(video.path, "utf8").toString("base64url");
			return redirect(`/video/${path}/info`);
		},
		{
			detail: { description: "Get a video's metadata informations" },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the video to retrieve.",
					example: "made-in-abyss-s1e13",
				}),
			}),
			response: {
				302: t.Void({
					description:
						"Redirected to the [/video/{path}/info](?api=transcoder#tag/metadata/get/:path/info) route (of the transcoder)",
				}),
				404: {
					...KError,
					description: "No video found with the given id or slug.",
				},
			},
		},
	)
	.get(
		":id/thumbnails.vtt",
		async ({ params: { id }, status, redirect }) => {
			const [video] = await db
				.select({
					path: videos.path,
				})
				.from(videos)
				.leftJoin(entryVideoJoin, eq(videos.pk, entryVideoJoin.videoPk))
				.where(isUuid(id) ? eq(videos.id, id) : eq(entryVideoJoin.slug, id))
				.limit(1);

			if (!video) {
				return status(404, {
					status: 404,
					message: `No video found with id or slug '${id}'`,
				});
			}
			const path = Buffer.from(video.path, "utf8").toString("base64url");
			return redirect(`/video/${path}/thumbnails.vtt`);
		},
		{
			detail: {
				description: "Get redirected to the direct stream of the video",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the video to watch.",
					example: "made-in-abyss-s1e13",
				}),
			}),
			response: {
				302: t.Void({
					description:
						"Redirected to the [/video/{path}/direct](?api=transcoder#tag/metadata/get/:path/direct) route (of the transcoder)",
				}),
				404: {
					...KError,
					description: "No video found with the given id or slug.",
				},
			},
		},
	)
	.get(
		":id/direct",
		async ({ params: { id }, status, redirect }) => {
			const [video] = await db
				.select({
					path: videos.path,
				})
				.from(videos)
				.leftJoin(entryVideoJoin, eq(videos.pk, entryVideoJoin.videoPk))
				.where(isUuid(id) ? eq(videos.id, id) : eq(entryVideoJoin.slug, id))
				.limit(1);

			if (!video) {
				return status(404, {
					status: 404,
					message: `No video found with id or slug '${id}'`,
				});
			}
			const path = Buffer.from(video.path, "utf8").toString("base64url");
			const filename = path.substring(path.lastIndexOf("/") + 1);
			return redirect(`/video/${path}/direct/${filename}`);
		},
		{
			detail: {
				description: "Get redirected to the direct stream of the video",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the video to watch.",
					example: "made-in-abyss-s1e13",
				}),
			}),
			response: {
				302: t.Void({
					description:
						"Redirected to the [/video/{path}/direct](?api=transcoder#tag/metadata/get/:path/direct) route (of the transcoder)",
				}),
				404: {
					...KError,
					description: "No video found with the given id or slug.",
				},
			},
		},
	)
	.get(
		":id/master.m3u8",
		async ({ params: { id }, request, status, redirect }) => {
			const [video] = await db
				.select({
					path: videos.path,
				})
				.from(videos)
				.leftJoin(entryVideoJoin, eq(videos.pk, entryVideoJoin.videoPk))
				.where(isUuid(id) ? eq(videos.id, id) : eq(entryVideoJoin.slug, id))
				.limit(1);

			if (!video) {
				return status(404, {
					status: 404,
					message: `No video found with id or slug '${id}'`,
				});
			}
			const path = Buffer.from(video.path, "utf8").toString("base64url");
			const query = request.url.substring(request.url.indexOf("?"));
			return redirect(`/video/${path}/master.m3u8${query}`);
		},
		{
			detail: { description: "Get redirected to the master.m3u8 of the video" },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the video to watch.",
					example: "made-in-abyss-s1e13",
				}),
			}),
			response: {
				302: t.Void({
					description:
						"Redirected to the [/video/{path}/master.m3u8](?api=transcoder#tag/metadata/get/:path/master.m3u8) route (of the transcoder)",
				}),
				404: {
					...KError,
					description: "No video found with the given id or slug.",
				},
			},
		},
	)
	.get(
		"",
		async () => {
			const years = db.$with("years").as(
				db
					.select({
						guess: sql`${videos.guess}->>'title'`.as("guess"),
						year: sql`coalesce(year, 'unknown')`.as("year"),
						id: shows.id,
						slug: shows.slug,
					})
					.from(videos)
					.leftJoin(
						sql`jsonb_array_elements_text(${videos.guess}->'years') as year`,
						sql`true`,
					)
					.innerJoin(entryVideoJoin, eq(entryVideoJoin.videoPk, videos.pk))
					.innerJoin(entries, eq(entries.pk, entryVideoJoin.entryPk))
					.innerJoin(shows, eq(shows.pk, entries.showPk)),
			);

			const guess = db.$with("guess").as(
				db
					.select({
						guess: years.guess,
						years: jsonbObjectAgg(
							years.year,
							jsonbBuildObject({ id: years.id, slug: years.slug }),
						).as("years"),
					})
					.from(years)
					.groupBy(years.guess),
			);

			const [{ guesses }] = await db
				.with(years, guess)
				.select({
					guesses: jsonbObjectAgg<Record<string, Resource>>(
						guess.guess,
						guess.years,
					),
				})
				.from(guess);

			const paths = await db.select({ path: videos.path }).from(videos);

			const unmatched = await db
				.select({ path: videos.path })
				.from(videos)
				.where(
					notExists(
						db
							.select()
							.from(entryVideoJoin)
							.where(eq(entryVideoJoin.videoPk, videos.pk)),
					),
				);

			return {
				paths: paths.map((x) => x.path),
				guesses: guesses ?? {},
				unmatched: unmatched.map((x) => x.path),
			};
		},
		{
			detail: { description: "Get all video registered & guessed made" },
			response: {
				200: Guesses,
			},
		},
	)
	.get(
		"unmatched",
		async ({ query: { sort, query, limit, after }, request: { url } }) => {
			const ret = await db
				.select()
				.from(videos)
				.where(
					and(
						notExists(
							db
								.select()
								.from(entryVideoJoin)
								.where(eq(videos.pk, entryVideoJoin.videoPk)),
						),
						query
							? or(
									sql`${videos.path} %> ${query}::text`,
									sql`${videos.guess}->'title' %> ${query}::text`,
								)
							: undefined,
						keysetPaginate({ after, sort }),
					),
				)
				.orderBy(...(query ? [] : sortToSql(sort)), videos.pk)
				.limit(limit);
			return createPage(ret, { url, sort, limit });
		},
		{
			detail: { description: "Get unknown/unmatched videos." },
			query: t.Object({
				sort: Sort(
					{ createdAt: videos.createdAt, path: videos.path },
					{ default: ["-createdAt"], tablePk: videos.pk },
				),
				query: t.Optional(t.String({ description: description.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: description.after })),
			}),
			response: {
				200: Page(Video),
				422: KError,
			},
		},
	);

export const videosWriteH = new Elysia({ prefix: "/videos", tags: ["videos"] })
	.model({
		video: Video,
		"created-videos": t.Array(CreatedVideo),
		error: t.Object({}),
	})
	.use(auth)
	.post(
		"",
		async ({ body, status }) => {
			if (body.length === 0) {
				return status(422, { status: 422, message: "No videos" });
			}
			return await db.transaction(async (tx) => {
				let vids: { pk: number; id: string; path: string; guess: Guess }[] = [];
				try {
					vids = await tx
						.insert(videos)
						.select(unnestValues(body, videos))
						.onConflictDoUpdate({
							target: [videos.path],
							set: conflictUpdateAllExcept(videos, ["pk", "id", "createdAt"]),
						})
						.returning({
							pk: videos.pk,
							id: videos.id,
							path: videos.path,
							guess: videos.guess,
						});
				} catch (e) {
					if (!isUniqueConstraint(e)) throw e;
					return status(409, {
						status: 409,
						message: comment`
							Invalid rendering. A video with the same (rendering, part, version) combo
							(but with a different path) already exists in db.

							rendering should be computed by the sha of your path (excluding only the version & part numbers)
						`,
					});
				}

				const vidEntries = body.flatMap((x) => {
					if (!x.for) return [];
					return x.for.map((e) => ({
						video: vids.find((v) => v.path === x.path)!.pk,
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
					}));
				});

				if (!vidEntries.length) {
					return status(
						201,
						vids.map((x) => ({
							id: x.id,
							path: x.path,
							guess: x.guess,
							entries: [],
						})),
					);
				}

				const links = await linkVideos(tx, vidEntries);

				return status(
					201,
					vids.map((x) => ({
						id: x.id,
						path: x.path,
						guess: x.guess,
						entries: links[x.pk] ?? [],
					})),
				);
			});
		},
		{
			detail: {
				description: comment`
					Create videos in bulk.
					Duplicated videos will simply be ignored.

					If a videos has a \`guess\` field, it will be used to automatically register the video under an existing
					movie or entry.
				`,
			},
			body: t.Array(SeedVideo),
			response: {
				201: t.Array(CreatedVideo),
				409: {
					...KError,
					description:
						"Invalid rendering specified. (conflicts with an existing video)",
				},
				422: KError,
			},
		},
	)
	.delete(
		"",
		async ({ body }) => {
			return await db.transaction(async (tx) => {
				const vids = tx.$with("vids").as(
					tx
						.delete(videos)
						.where(eq(videos.path, sql`any(${sqlarr(body)})`))
						.returning({ pk: videos.pk, path: videos.path }),
				);

				const deletedJoin = await tx
					.with(vids)
					.select({ entryPk: entryVideoJoin.entryPk, path: vids.path })
					.from(entryVideoJoin)
					.rightJoin(vids, eq(vids.pk, entryVideoJoin.videoPk));

				const delEntries = await tx
					.update(entries)
					.set({ availableSince: null })
					.where(
						and(
							eq(
								entries.pk,
								sql`any(${sqlarr(
									deletedJoin.filter((x) => x.entryPk).map((x) => x.entryPk!),
								)})`,
							),
							notExists(
								tx
									.select()
									.from(entryVideoJoin)
									.where(eq(entries.pk, entryVideoJoin.entryPk)),
							),
						),
					)
					.returning({ show: entries.showPk });

				await updateAvailableCount(
					tx,
					delEntries.map((x) => x.show),
					false,
				);

				return [...new Set(deletedJoin.map((x) => x.path))];
			});
		},
		{
			detail: { description: "Delete videos in bulk." },
			body: t.Array(
				t.String({
					description: "Path of the video to delete",
					examples: [bubbleVideo.path],
				}),
			),
			response: { 200: t.Array(t.String()) },
		},
	)
	.post(
		"/link",
		async ({ body, status }) => {
			return await db.transaction(async (tx) => {
				const vids = await tx
					.select({ pk: videos.pk, id: videos.id, path: videos.path })
					.from(videos)
					.where(eq(videos.id, sql`any(${sqlarr(body.map((x) => x.id))})`));
				const lVids = body.flatMap((x) => {
					return x.for.map((e) => ({
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
					}));
				});
				const links = await linkVideos(tx, lVids);
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
			body: t.Array(
				t.Object({
					id: t.String({
						description: "Id of the video",
						format: "uuid",
					}),
					for: t.Array(SeedVideo.properties.for.items),
				}),
			),
			response: {
				201: t.Array(
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
				),
				422: KError,
			},
		},
	);
