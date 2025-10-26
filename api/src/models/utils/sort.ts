import { type SQL, type SQLWrapper, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { t } from "elysia";

export type Sort = {
	tablePk: SQLWrapper;
	sort: {
		sql: SQLWrapper;
		isNullable: boolean;
		accessor: (cursor: any) => unknown;
		desc: boolean;
	}[];
	random?: { seed: number };
};

export const Sort = (
	values: Record<
		string,
		| PgColumn
		| {
				sql: PgColumn;
				accessor: (cursor: any) => unknown;
		  }
		| {
				sql: SQLWrapper;
				isNullable: boolean;
				accessor: (cursor: any) => unknown;
		  }
	>,
	{
		description = "How to sort the query",
		default: def,
		tablePk,
	}: {
		default?: (keyof typeof values)[];
		tablePk: SQLWrapper;
		description?: string;
	},
) =>
	t
		.Transform(
			t.Array(
				t.Union([
					t.UnionEnum([
						...Object.keys(values),
						...Object.keys(values).map((x) => `-${x}`),
						"random",
					] as any),
					t.TemplateLiteral("random:${number}"),
				]),
				{
					default: def,
					description: description,
				},
			),
		)
		.Decode((sort: string[]): Sort => {
			if (!Array.isArray(sort)) sort = [sort];
			const random = sort.find((x) => x.startsWith("random"));
			if (random) {
				const seed = random.includes(":")
					? Number.parseInt(random.substring("random:".length), 10)
					: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
				return { tablePk, random: { seed }, sort: [] };
			}
			return {
				tablePk,
				sort: sort.map((x) => {
					const desc = x[0] === "-";
					const key = desc ? x.substring(1) : x;
					if ("getSQL" in values[key]) {
						return {
							sql: values[key],
							isNullable: !values[key].notNull,
							accessor: (x) => x[key],
							desc,
						};
					}
					return {
						sql: values[key].sql,
						isNullable:
							"isNullable" in values[key]
								? values[key].isNullable
								: !values[key].sql.notNull,
						accessor: values[key].accessor,
						desc,
					};
				}),
			};
		})
		.Encode(() => {
			throw new Error("Encode not supported for sort");
		});

export const sortToSql = (sort: Sort | undefined) => {
	if (!sort) return [];
	if (sort.random) {
		return [sql`md5(${sort.random.seed} || ${sort.tablePk})`];
	}
	return sort.sort.map((x) =>
		x.desc ? sql`${x.sql} desc nulls last` : (x.sql as SQL),
	);
};
