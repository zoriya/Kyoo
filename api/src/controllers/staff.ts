import { and, eq, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "~/db";
import { showTranslations, shows } from "~/db/schema";
import { roles, staff } from "~/db/schema/staff";
import { getColumns, sqlarr } from "~/db/utils";
import { KError } from "~/models/error";
import type { MovieStatus } from "~/models/movie";
import { Role, RoleWShow, Staff } from "~/models/staff";
import {
	Filter,
	type FilterDef,
	type Image,
	Page,
	Sort,
	createPage,
	isUuid,
	keysetPaginate,
	processLanguages,
	sortToSql,
} from "~/models/utils";
import { desc } from "~/models/utils/descriptions";
import { showFilters, showSort } from "./shows/logic";

const staffSort = Sort(["slug", "name", "latinName"], { default: ["slug"] });

const roleShowFilters: FilterDef = {
	kind: {
		column: roles.kind,
		type: "enum",
		values: Role.properties.kind.enum,
	},
	...showFilters,
};

export const staffH = new Elysia({ tags: ["staff"] })
	.model({
		staff: Staff,
		role: Role,
	})
	.get(
		"/staff/:id",
		async ({ params: { id }, error }) => {
			const [ret] = await db
				.select()
				.from(staff)
				.where(isUuid(id) ? eq(staff.id, id) : eq(staff.slug, id))
				.limit(1);
			if (!ret) {
				return error(404, {
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
		async ({ error, redirect }) => {
			const [member] = await db
				.select({ slug: staff.slug })
				.from(staff)
				.orderBy(sql`random()`)
				.limit(1);
			if (!member)
				return error(404, {
					status: 404,
					message: "No staff in the database.",
				});
			return redirect(`/staff/${member.slug}`);
		},
		{
			detail: {
				description: "Get a random staff member.",
			},
			response: {
				302: t.Void({
					description:
						"Redirected to the [/staff/{id}](#tag/staff/GET/staff/{id}) route.",
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
			error,
		}) => {
			const [member] = await db
				.select({ pk: staff.pk })
				.from(staff)
				.where(isUuid(id) ? eq(staff.id, id) : eq(staff.slug, id))
				.limit(1);

			if (!member) {
				return error(404, {
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

						...(preferOriginal && {
							poster: sql<Image>`coalesce(nullif(${shows.original}->'poster', 'null'::jsonb), ${transQ.poster})`,
							thumbnail: sql<Image>`coalesce(nullif(${shows.original}->'thumbnail', 'null'::jsonb), ${transQ.thumbnail})`,
							banner: sql<Image>`coalesce(nullif(${shows.original}->'banner', 'null'::jsonb), ${transQ.banner})`,
							logo: sql<Image>`coalesce(nullif(${shows.original}->'logo', 'null'::jsonb), ${transQ.logo})`,
						}),
					},
				})
				.from(roles)
				.innerJoin(shows, eq(roles.showPk, shows.pk))
				.where(
					and(
						eq(roles.staffPk, member.pk),
						filter,
						query ? sql`${transQ.name} %> ${query}::text` : undefined,
						keysetPaginate({ table: shows, after, sort }),
					),
				)
				.orderBy(
					...(query
						? [sql`word_similarity(${query}::text, ${transQ.name})`]
						: sortToSql(sort, shows)),
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
						keysetPaginate({ table: staff, after, sort }),
					),
				)
				.orderBy(
					...(query
						? [sql`word_similarity(${query}::text, ${staff.name})`]
						: sortToSql(sort, staff)),
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
	);
