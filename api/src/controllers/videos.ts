import {
	and,
	desc,
	eq,
	gt,
	isNotNull,
	lt,
	max,
	min,
	notExists,
	or,
	sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Elysia, t } from "elysia";
import { auth } from "~/auth";
import { db } from "~/db";
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
	getColumns,
	jsonbAgg,
	jsonbBuildObject,
	jsonbObjectAgg,
	sqlarr,
} from "~/db/utils";
import { Entry } from "~/models/entry";
import { KError } from "~/models/error";
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
import { Guesses, Video } from "~/models/video";
import type { MovieWatchStatus, SerieWatchStatus } from "~/models/watchlist";
import {
	entryProgressQ,
	entryVideosQ,
	getEntryTransQ,
	mapProgress,
} from "./entries";

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
		"guesses",
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
