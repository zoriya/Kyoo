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

export type SortVal =
	| PgColumn
	| {
			sql: PgColumn;
			accessor: (cursor: any) => unknown;
	  }
	| {
			sql: SQLWrapper;
			isNullable: boolean;
			accessor: (cursor: any) => unknown;
	  };

export const Sort = (
	values: Record<string, SortVal | SortVal[]>,
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
						"random",
						...Object.keys(values),
						...Object.keys(values).map((x) => `-${x}`),
					]),
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
				sort: sort.flatMap((x) => {
					const desc = x[0] === "-";
					const key = desc ? x.substring(1) : x;
					const process = (val: SortVal): Sort["sort"][0] => {
						if ("getSQL" in val) {
							return {
								sql: val,
								isNullable: !val.notNull,
								accessor: (x) => x[key],
								desc,
							};
						}
						return {
							sql: val.sql,
							isNullable:
								"isNullable" in val ? val.isNullable : !val.sql.notNull,
							accessor: val.accessor,
							desc,
						};
					};
					return Array.isArray(values[key])
						? values[key].map(process)
						: process(values[key]);
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
