import {
	and,
	desc,
	eq,
	gt,
	inArray,
	isNotNull,
	lt,
	max,
	min,
	notExists,
	or,
	type SQL,
	sql,
	type WithSubquery,
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
import type { Entry } from "~/models/entry";
import { KError } from "~/models/error";
import { FullVideo } from "~/models/full-video";
import type { Progress } from "~/models/history";
import type { Movie, MovieStatus } from "~/models/movie";
import type { Serie } from "~/models/serie";
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
import { comment, uniqBy } from "~/utils";
import {
	entryProgressQ,
	entryVideosQ,
	getEntryTransQ,
	mapProgress,
} from "./entries";

const videoSort = Sort(
	{
		path: videos.path,
		entry: [
			{
				sql: entries.showPk,
				isNullable: true,
				accessor: (x: any) => x.entries?.[0]?.showPk,
			},
			{
				sql: entries.order,
				isNullable: true,
				accessor: (x: any) => x.entries?.[0]?.order,
			},
		],
	},
	{
		default: ["path"],
		tablePk: videos.pk,
	},
);

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

// make an alias so entry video join is not usable on subqueries
const evJoin = alias(entryVideoJoin, "evj");

export async function getVideos({
	after,
	limit,
	query,
	sort,
	filter,
	languages,
	preferOriginal = false,
	relations = [],
	userId,
	cte = [],
}: {
	after?: string;
	limit: number;
	query?: string;
	sort?: Sort;
	filter?: SQL;
	languages: string[];
	preferOriginal?: boolean;
	relations?: (keyof typeof videoRelations)[];
	userId: string;
	cte?: WithSubquery[];
}) {
	let ret = await db
		.with(...cte)
		.select({
			...getColumns(videos),
			...buildRelations(["slugs", ...relations], videoRelations, {
				languages,
				preferOriginal,
			}),
		})
		.from(videos)
		.leftJoin(evJoin, eq(videos.pk, evJoin.videoPk))
		// join entries only for sorting, we can't select entries here for perf reasons.
		.leftJoin(entries, eq(entries.pk, evJoin.entryPk))
		.where(
			and(
				filter,
				query ? sql`${videos.path} %> ${query}::text` : undefined,
				keysetPaginate({ after, sort }),
			),
		)
		.orderBy(
			...(query
				? [sql`word_similarity(${query}::text, ${videos.path}) desc`]
				: sortToSql(sort)),
			videos.pk,
		)
		.limit(limit)
		.execute({ userId });

	ret = uniqBy(ret, (x) => x.pk);
	if (!ret.length) return [];

	const entriesByVideo = await fetchEntriesForVideos({
		videoPks: ret.map((x) => x.pk),
		languages,
		userId,
	});

	return ret.map((x) => ({
		...x,
		entries: entriesByVideo[x.pk] ?? [],
	})) as unknown as FullVideo[];
}

async function fetchEntriesForVideos({
	videoPks,
	languages,
	userId,
}: {
	videoPks: number[];
	languages: string[];
	userId: string;
}) {
	if (!videoPks.length) return {};

	const transQ = getEntryTransQ(languages);
	const ret = await db
		.select({
			videoPk: entryVideoJoin.videoPk,
			...getColumns(entries),
			...getColumns(transQ),
			number: entries.episodeNumber,
		})
		.from(entryVideoJoin)
		.innerJoin(entries, eq(entries.pk, entryVideoJoin.entryPk))
		.innerJoin(transQ, eq(entries.pk, transQ.pk))
		.where(eq(entryVideoJoin.videoPk, sql`any(${sqlarr(videoPks)})`))
		.execute({ userId });

	return Object.groupBy(ret, (x) => x.videoPk);
}

export const videosReadH = new Elysia({ tags: ["videos"] })
	.use(auth)
	.get(
		"videos/:id",
		async ({
			params: { id },
			query: { with: relations, preferOriginal },
			headers: { "accept-language": langs },
			jwt: { sub, settings },
			status,
		}) => {
			const languages = processLanguages(langs);
			const [ret] = await getVideos({
				limit: 1,
				filter: and(isUuid(id) ? eq(videos.id, id) : eq(evJoin.slug, id)),
				languages,
				preferOriginal: preferOriginal ?? settings.preferOriginal,
				relations,
				userId: sub,
			});
			if (!ret) {
				return status(404, {
					status: 404,
					message: `No video found with id or slug '${id}'`,
				});
			}
			return ret;
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
				200: FullVideo,
				404: {
					...KError,
					description: "No video found with the given id or slug.",
				},
				422: KError,
			},
		},
	)
	.get(
		"videos",
		async ({
			query: { limit, after, query, sort, preferOriginal },
			headers: { "accept-language": langs, ...headers },
			request: { url },
			jwt: { sub, settings },
		}) => {
			const languages = processLanguages(langs);
			const items = await getVideos({
				limit,
				after,
				query,
				sort,
				languages,
				preferOriginal: preferOriginal ?? settings.preferOriginal,
				userId: sub,
			});
			return createPage(items, { url, sort, limit, headers });
		},
		{
			detail: {
				description: "Get a video & it's related entries",
			},
			query: t.Object({
				sort: videoSort,
				query: t.Optional(t.String({ description: description.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: description.after })),
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
				200: Page(FullVideo),
				404: {
					...KError,
					description: "No video found with the given id or slug.",
				},
				422: KError,
			},
		},
	)
	.get(
		"videos/guesses",
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
		"videos/unmatched",
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
	)
	.get(
		"series/:id/videos",
		async ({
			params: { id },
			query: { limit, after, query, sort, preferOriginal, titles },
			headers: { "accept-language": langs, ...headers },
			request: { url },
			jwt: { sub, settings },
			status,
		}) => {
			const [serie] = await db
				.select({ pk: shows.pk })
				.from(shows)
				.where(
					and(
						eq(shows.kind, "serie"),
						isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
					),
				)
				.limit(1);

			if (!serie) {
				return status(404, {
					status: 404,
					message: `No serie with the id or slug: '${id}'.`,
				});
			}

			const titleGuess = db.$with("title_guess").as(
				db
					.selectDistinctOn([sql<string>`${videos.guess}->>'title'`], {
						title: sql<string>`${videos.guess}->>'title'`.as("title"),
					})
					.from(videos)
					.leftJoin(evJoin, eq(videos.pk, evJoin.videoPk))
					.leftJoin(entries, eq(entries.pk, evJoin.entryPk))
					.where(eq(entries.showPk, serie.pk))
					.union(
						db
							.select({ title: sql<string>`title` })
							.from(sql`unnest(${sqlarr(titles ?? [])}::text[]) as title`),
					),
			);

			const languages = processLanguages(langs);
			const items = await getVideos({
				cte: [titleGuess],
				filter: or(
					eq(entries.showPk, serie.pk),
					inArray(
						sql<string>`${videos.guess}->>'title'`,
						db.select().from(titleGuess),
					),
				),
				limit,
				after,
				query,
				sort,
				languages,
				preferOriginal: preferOriginal ?? settings.preferOriginal,
				userId: sub,
			});
			for (const i of items)
				i.entries = i.entries.filter(
					(x) =>
						(x as unknown as typeof entries.$inferSelect).showPk === serie.pk,
				);
			return createPage(items, { url, sort, limit, headers });
		},
		{
			detail: { description: "List videos of a serie" },
			params: t.Object({
				id: t.String({
					description: "The id or slug of the serie.",
					example: "made-in-abyss",
				}),
			}),
			query: t.Object({
				sort: videoSort,
				query: t.Optional(t.String({ description: description.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: description.after })),
				preferOriginal: t.Optional(
					t.Boolean({
						description: description.preferOriginal,
					}),
				),
				titles: t.Optional(
					t.Array(
						t.String({
							description: comment`
								Return videos in the serie + videos with a title
								guess equal to one of the element of this list
							`,
						}),
					),
				),
			}),
			headers: t.Object({
				"accept-language": AcceptLanguage(),
			}),
			response: {
				200: Page(FullVideo),
				404: {
					...KError,
					description: "No video found with the given id or slug.",
				},
				422: KError,
			},
		},
	);
