import { and, eq, type SQL, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { auth } from "~/auth";
import { prefix } from "~/base";
import { db } from "~/db";
import { profiles, shows, showTranslations } from "~/db/schema";
import { roles, staff } from "~/db/schema/staff";
import { watchlist } from "~/db/schema/watchlist";
import { getColumns, jsonbBuildObject, sqlarr } from "~/db/utils";
import { KError } from "~/models/error";
import type { MovieStatus } from "~/models/movie";
import { Role, Staff } from "~/models/staff";
import { RoleWShow, RoleWStaff } from "~/models/staff-roles";
import {
	AcceptLanguage,
	createPage,
	Filter,
	type FilterDef,
	type Image,
	isUuid,
	keysetPaginate,
	Page,
	processLanguages,
	Sort,
	sortToSql,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import type { MovieWatchStatus, SerieWatchStatus } from "~/models/watchlist";
import { showFilters, showSort } from "./shows/logic";

const staffSort = Sort(
	{
		slug: staff.slug,
		name: staff.name,
		latinName: staff.latinName,
	},
	{
		default: ["slug"],
		tablePk: staff.pk,
	},
);

const staffRoleSort = Sort(
	{
		order: roles.order,
		slug: { sql: staff.slug, accessor: (x) => x.staff.slug },
		name: { sql: staff.name, accessor: (x) => x.staff.name },
		latinName: { sql: staff.latinName, accessor: (x) => x.staff.latinName },
		characterName: {
			sql: sql`${roles.character}->>'name'`,
			isNullable: true,
			accessor: (x) => x.character.name,
		},
		characterLatinName: {
			sql: sql`${roles.character}->>'latinName'`,
			isNullable: true,
			accessor: (x) => x.character.latinName,
		},
	},
	{
		default: ["order"],
		tablePk: staff.pk,
	},
);

const staffRoleFilter: FilterDef = {
	kind: {
		column: roles.kind,
		type: "enum",
		values: Role.properties.kind.enum,
	},
};

const roleShowFilters: FilterDef = {
	...staffRoleFilter,
	...showFilters,
};

async function getStaffRoles({
	after,
	limit,
	query,
	sort,
	filter,
}: {
	after?: string;
	limit: number;
	query?: string;
	sort?: Sort;
	filter?: SQL;
}) {
	return await db
		.select({
			...getColumns(roles),
			staff: getColumns(staff),
		})
		.from(roles)
		.innerJoin(staff, eq(roles.staffPk, staff.pk))
		.where(
			and(
				filter,
				query ? sql`${staff.name} %> ${query}::text` : undefined,
				keysetPaginate({ sort, after }),
			),
		)
		.orderBy(
			...(query
				? [sql`word_similarity(${query}::text, ${staff.name})`]
				: sortToSql(sort)),
			staff.pk,
		)
		.limit(limit);
}

export const staffH = new Elysia({ tags: ["staff"] })
	.model({
		staff: Staff,
		role: Role,
	})
	.use(auth)
	.get(
		"/staff/:id",
		async ({ params: { id }, status }) => {
			const [ret] = await db
				.select()
				.from(staff)
				.where(isUuid(id) ? eq(staff.id, id) : eq(staff.slug, id))
				.limit(1);
			if (!ret) {
				return status(404, {
					status: 404,
					message: `No staff found with the id or slug: '${id}'`,
				});
			}
			return ret;
		},
		{
			detail: {
				description: "Get a staff member by id or slug.",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the staff to retrieve.",
					example: "hiroyuki-sawano",
				}),
			}),
			response: {
				200: "staff",
				404: {
					...KError,
					description: "No staff found with the given id or slug.",
				},
			},
		},
	)
	.get(
		"/staff/random",
		async ({ status, redirect }) => {
			const [member] = await db
				.select({ slug: staff.slug })
				.from(staff)
				.orderBy(sql`random()`)
				.limit(1);
			if (!member)
				return status(404, {
					status: 404,
					message: "No staff in the database.",
				});
			return redirect(`${prefix}/staff/${member.slug}`);
		},
		{
			detail: {
				description: "Get a random staff member.",
			},
			response: {
				302: t.Void({
					description:
						"Redirected to the [/staff/{id}](#tag/staff/get/api/staff/{id}) route.",
				}),
				404: {
					...KError,
					description: "No staff in the database.",
				},
			},
		},
	)
	.get(
		"/staff/:id/roles",
		async ({
			params: { id },
			query: { limit, after, query, sort, filter, preferOriginal },
			headers: { "accept-language": languages },
			request: { url },
			jwt: { sub, settings },
			status,
		}) => {
			const [member] = await db
				.select({ pk: staff.pk })
				.from(staff)
				.where(isUuid(id) ? eq(staff.id, id) : eq(staff.slug, id))
				.limit(1);

			if (!member) {
				return status(404, {
					status: 404,
					message: `No staff member with the id or slug: '${id}'.`,
				});
			}

			const langs = processLanguages(languages);
			const transQ = db
				.selectDistinctOn([showTranslations.pk])
				.from(showTranslations)
				.orderBy(
					showTranslations.pk,
					sql`array_position(${sqlarr(langs)}, ${showTranslations.language})`,
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
				.where(and(eq(profiles.id, sub), eq(watchlist.showPk, shows.pk)))
				.as("watchstatus");

			const items = await db
				.select({
					...getColumns(roles),
					show: {
						...getColumns(shows),
						...getColumns(transQ),

						// movie columns (status is only a typescript hint)
						status: sql<MovieStatus>`${shows.status}`,
						airDate: shows.startAir,
						kind: sql<any>`${shows.kind}`,
						isAvailable: sql<boolean>`${shows.availableCount} != 0`,

						...((preferOriginal ?? settings.preferOriginal) && {
							poster: sql<Image>`coalesce(nullif(${shows.original}->'poster', 'null'::jsonb), ${transQ.poster})`,
							thumbnail: sql<Image>`coalesce(nullif(${shows.original}->'thumbnail', 'null'::jsonb), ${transQ.thumbnail})`,
							banner: sql<Image>`coalesce(nullif(${shows.original}->'banner', 'null'::jsonb), ${transQ.banner})`,
							logo: sql<Image>`coalesce(nullif(${shows.original}->'logo', 'null'::jsonb), ${transQ.logo})`,
						}),
						watchStatus: sql`${watchStatusQ}`,
					},
				})
				.from(roles)
				.innerJoin(shows, eq(roles.showPk, shows.pk))
				.innerJoin(transQ, eq(shows.pk, transQ.pk))
				.where(
					and(
						eq(roles.staffPk, member.pk),
						filter,
						query ? sql`${transQ.name} %> ${query}::text` : undefined,
						keysetPaginate({ after, sort }),
					),
				)
				.orderBy(
					...(query
						? [sql`word_similarity(${query}::text, ${transQ.name})`]
						: sortToSql(sort)),
					roles.showPk,
				)
				.limit(limit);
			return createPage(items, { url, sort, limit });
		},
		{
			detail: {
				description: "Get all roles this staff member worked as/on.",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the staff to retrieve.",
					example: "hiroyuki-sawano",
				}),
			}),
			query: t.Object({
				sort: showSort,
				filter: t.Optional(Filter({ def: roleShowFilters })),
				query: t.Optional(t.String({ description: desc.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: desc.after })),
				preferOriginal: t.Optional(
					t.Boolean({
						description: desc.preferOriginal,
					}),
				),
			}),
			headers: t.Object(
				{
					"accept-language": AcceptLanguage(),
				},
				{ additionalProperties: true },
			),
			response: {
				200: Page(RoleWShow),
				404: {
					...KError,
					description: "No staff found with the given id or slug.",
				},
				422: KError,
			},
		},
	)
	.get(
		"/staff",
		async ({ query: { limit, after, sort, query }, request: { url } }) => {
			const items = await db
				.select()
				.from(staff)
				.where(
					and(
						query ? sql`${staff.name} %> ${query}::text` : undefined,
						keysetPaginate({ after, sort }),
					),
				)
				.orderBy(
					...(query
						? [sql`word_similarity(${query}::text, ${staff.name})`]
						: sortToSql(sort)),
					staff.pk,
				)
				.limit(limit);
			return createPage(items, { url, sort, limit });
		},
		{
			detail: {
				description: "Get all staff members known by kyoo.",
			},
			query: t.Object({
				sort: staffSort,
				query: t.Optional(t.String({ description: desc.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: desc.after })),
			}),
			response: {
				200: Page(Staff),
				422: KError,
			},
		},
	)
	.get(
		"/movies/:id/staff",
		async ({
			params: { id },
			query: { limit, after, query, sort, filter },
			request: { url },
			status,
		}) => {
			const [movie] = await db
				.select({ pk: shows.pk })
				.from(shows)
				.where(
					and(
						eq(shows.kind, "movie"),
						isUuid(id) ? eq(shows.id, id) : eq(shows.slug, id),
					),
				)
				.limit(1);

			if (!movie) {
				return status(404, {
					status: 404,
					message: `No movie with the id or slug: '${id}'.`,
				});
			}

			const items = await getStaffRoles({
				limit,
				after,
				query,
				sort,
				filter: and(eq(roles.showPk, movie.pk), filter),
			});
			return createPage(items, { url, sort, limit });
		},
		{
			detail: {
				description: "Get all staff member who worked on this movie",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the movie.",
					example: "bubble",
				}),
			}),
			query: t.Object({
				sort: staffRoleSort,
				filter: t.Optional(Filter({ def: staffRoleFilter })),
				query: t.Optional(t.String({ description: desc.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: desc.after })),
			}),
			response: {
				200: Page(RoleWStaff),
				404: {
					...KError,
					description: "No movie found with the given id or slug.",
				},
				422: KError,
			},
		},
	)
	.get(
		"/series/:id/staff",
		async ({
			params: { id },
			query: { limit, after, query, sort, filter },
			request: { url },
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

			const items = await getStaffRoles({
				limit,
				after,
				query,
				sort,
				filter: and(eq(roles.showPk, serie.pk), filter),
			});
			return createPage(items, { url, sort, limit });
		},
		{
			detail: {
				description: "Get all staff member who worked on this serie",
			},
			params: t.Object({
				id: t.String({
					description: "The id or slug of the serie.",
					example: "made-in-abyss",
				}),
			}),
			query: t.Object({
				sort: staffRoleSort,
				filter: t.Optional(Filter({ def: staffRoleFilter })),
				query: t.Optional(t.String({ description: desc.query })),
				limit: t.Integer({
					minimum: 1,
					maximum: 250,
					default: 50,
					description: "Max page size.",
				}),
				after: t.Optional(t.String({ description: desc.after })),
			}),
			response: {
				200: Page(RoleWStaff),
				404: {
					...KError,
					description: "No serie found with the given id or slug.",
				},
				422: KError,
			},
		},
	);
