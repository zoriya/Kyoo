import type { StaticDecode } from "@sinclair/typebox";
import { type SQL, and, eq, ne, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "~/db";
import { entries, entryTranslations, shows } from "~/db/schema";
import { getColumns, sqlarr } from "~/db/utils";
import {
	Entry,
	Episode,
	Extra,
	ExtraType,
	MovieEntry,
	Special,
	UnknownEntry,
} from "~/models/entry";
import { KError } from "~/models/error";
import { madeInAbyss } from "~/models/examples";
import {
	AcceptLanguage,
	Filter,
	type FilterDef,
	Page,
	Sort,
	createPage,
	isUuid,
	keysetPaginate,
	processLanguages,
	sortToSql,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";

const entryFilters: FilterDef = {
	kind: {
		column: entries.kind,
		type: "enum",
		values: ["episode", "movie", "special"],
	},
	seasonNumber: { column: entries.seasonNumber, type: "int" },
	episodeNumber: { column: entries.episodeNumber, type: "int" },
	number: { column: entries.episodeNumber, type: "int" },
	order: { column: entries.order, type: "float" },
	runtime: { column: entries.runtime, type: "float" },
	airDate: { column: entries.airDate, type: "date" },
};

const extraFilters: FilterDef = {
	kind: { column: entries.extraKind, type: "enum", values: ExtraType.enum },
	runtime: { column: entries.runtime, type: "float" },
};

const entrySort = Sort(
	[
		"order",
		"seasonNumber",
		"episodeNumber",
		"number",
		"airDate",
		"nextRefresh",
	],
	{
		default: ["order"],
		remap: {
			number: "episodeNumber",
		},
	},
);

async function getEntries(
	serie: string,
	{
		after,
		limit,
		query,
		sort,
		filter,
		languages,
	}: {
		after: string | undefined;
		limit: number;
		query: string | undefined;
		sort: StaticDecode<typeof entrySort>;
		filter: SQL | undefined;
		languages: string[];
	},
) {
	const show = db.$with("serie").as(
		db
			.select({ pk: shows.pk })
			.from(shows)
			.where(
				and(
					eq(shows.kind, "serie"),
					isUuid(serie) ? eq(shows.id, serie) : eq(shows.slug, serie),
				),
			)
			.limit(1),
	);

	const transQ = db
		.selectDistinctOn([entryTranslations.pk])
		.from(entryTranslations)
		.orderBy(
			entryTranslations.pk,
			sql`array_position(${sqlarr(languages)}, ${entryTranslations.language})`,
		)
		.as("t");
	const { pk, ...transCol } = getColumns(transQ);

	return await db
		.with(show)
		.select({
			...getColumns(entries),
			...transCol,
		})
		.from(entries)
		.innerJoin(transQ, eq(entries.pk, transQ.pk))
		.where(
			and(
				eq(entries.showPk, show.pk),
				filter,
				query ? sql`${transQ.name} %> ${query}::text` : undefined,
				keysetPaginate({ table: entries, after, sort }),
			),
		)
		.orderBy(
			...(query
				? [sql`word_similarity(${query}::text, ${transQ.name})`]
				: sortToSql(sort, entries)),
			entries.pk,
		)
		.limit(limit);
}

export const entriesH = new Elysia()
	.model({
		episode: Episode,
		movie_entry: MovieEntry,
		special: Special,
		extra: Extra,
		unknown_entry: UnknownEntry,
		error: t.Object({}),
	})
	.model((models) => ({
		...models,
		entry: t.Union([models.episode, models.movie_entry, models.special]),
	}))
	.get(
		"/series/:id/entries",
		async ({
			params: { id },
			query: { limit, after, query, sort, filter },
			headers: { "accept-language": languages },
			request: { url },
		}) => {
			const langs = processLanguages(languages);
			const items = await getEntries(id, {
				limit,
				after,
				query,
				sort,
				filter: and(
					ne(entries.kind, "extra"),
					ne(entries.kind, "unknown"),
					filter,
				),
				languages: langs,
			});
			return createPage(items, { url, sort, limit });
		},
		{
			detail: { description: "Get entries of a serie" },
			path: t.Object({
				id: t.String({
					description: "The id or slug of the serie.",
					examples: [madeInAbyss.slug],
				}),
			}),
			query: t.Object({
				sort: entrySort,
				filter: t.Optional(Filter({ def: entryFilters })),
				query: t.Optional(t.String({ description: desc.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: desc.after })),
			}),
			headers: t.Object({
				"accept-language": AcceptLanguage({ autoFallback: true }),
			}),
			response: {
				200: Page(Entry),
				422: KError,
			},
		},
	)
	.get("/extras/:id", () => "hello" as unknown as Extra, {
		response: { 200: "extra" },
	})
	.get("/unknowns/:id", () => "hello" as unknown as UnknownEntry, {
		response: { 200: "unknown_entry" },
	});
