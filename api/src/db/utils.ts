import {
	type Column,
	type ColumnsSelection,
	getTableColumns,
	is,
	type SQL,
	type SQLWrapper,
	type Subquery,
	sql,
	Table,
	type TableConfig,
	View,
	ViewBaseConfig,
} from "drizzle-orm";
import type { CasingCache } from "drizzle-orm/casing";
import type { AnyMySqlSelect } from "drizzle-orm/mysql-core";
import type {
	AnyPgSelect,
	PgTableWithColumns,
	SelectedFieldsFlat,
} from "drizzle-orm/pg-core";
import type { AnySQLiteSelect } from "drizzle-orm/sqlite-core";
import type { WithSubquery } from "drizzle-orm/subquery";
import { db } from "./index";

// https://github.com/sindresorhus/type-fest/blob/main/source/simplify.d.ts#L58
type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

// See https://github.com/drizzle-team/drizzle-orm/pull/1789
type Select = AnyPgSelect | AnyMySqlSelect | AnySQLiteSelect;
type AnySelect = Simplify<
	Omit<Select, "where"> & Partial<Pick<Select, "where">>
>;
export function getColumns<
	T extends
		| Table
		| View
		| Subquery<string, ColumnsSelection>
		| WithSubquery<string, ColumnsSelection>
		| AnySelect,
>(
	table: T,
): T extends Table
	? T["_"]["columns"]
	: T extends View | Subquery | WithSubquery | AnySelect
		? T["_"]["selectedFields"]
		: never {
	return is(table, Table)
		? (table as any)[(Table as any).Symbol.Columns]
		: is(table, View)
			? (table as any)[ViewBaseConfig].selectedFields
			: table._.selectedFields;
}

// See https://github.com/drizzle-team/drizzle-orm/issues/1728
export function conflictUpdateAllExcept<
	T extends Table,
	E extends (keyof T["_"]["columns"])[],
>(table: T, except: E) {
	const columns = getTableColumns(table);
	const updateColumns = Object.entries(columns).filter(
		([col]) => !except.includes(col),
	);

	return updateColumns.reduce(
		(acc, [colName, col]) => {
			// @ts-expect-error: drizzle internal
			const name = (db.dialect.casing as CasingCache).getColumnCasing(col);
			acc[colName as keyof typeof acc] = sql.raw(`excluded."${name}"`);
			return acc;
		},
		{} as Omit<Record<keyof T["_"]["columns"], SQL>, E[number]>,
	);
}

// drizzle is bugged and doesn't allow js arrays to be used in raw sql.
export function sqlarr(array: unknown[]): string {
	return `{${array
		.map((item) =>
			!item || item === "null"
				? "null"
				: Array.isArray(item)
					? sqlarr(item)
					: typeof item === "object"
						? `"${JSON.stringify(item).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`
						: `"${item}"`,
		)
		.join(", ")}}`;
}

// See https://github.com/drizzle-team/drizzle-orm/issues/4044
export function values<K extends string>(
	items: Record<K, unknown>[],
	typeInfo: Partial<Record<K, string>> = {},
) {
	if (items[0] === undefined)
		throw new Error("Invalid values, expecting at least one items");
	const [firstProp, ...props] = Object.keys(items[0]) as K[];
	const values = items
		.map((x, i) => {
			let ret = sql`(${x[firstProp]}`;
			if (i === 0 && typeInfo[firstProp])
				ret = sql`${ret}::${sql.raw(typeInfo[firstProp])}`;
			for (const val of props) {
				ret = sql`${ret}, ${x[val]}`;
				if (i === 0 && typeInfo[val])
					ret = sql`${ret}::${sql.raw(typeInfo[val])}`;
			}
			return sql`${ret})`;
		})
		.reduce((acc, x) => sql`${acc}, ${x}`);
	const valueNames = [firstProp, ...props].join(", ");

	return {
		as: (name: string) => {
			return sql`(values ${values}) as ${sql.raw(name)}(${sql.raw(valueNames)})`;
		},
	};
}

/* goal:
 *  unnestValues([{a: 1, b: 2}, {a: 3, b: 4}], tbl)
 *
 * ```sql
 * select a, b, now() as updated_at from unnest($1::integer[], $2::integer[]);
 * ```
 * params:
 *   $1: [1, 2]
 *   $2: [3, 4]
 *
 * select
 */
export const unnestValues = <
	T extends Record<string, unknown>,
	C extends TableConfig = never,
>(
	values: T[],
	typeInfo: PgTableWithColumns<C>,
) => {
	if (values[0] === undefined)
		throw new Error("Invalid values, expecting at least one items");

	const columns = getTableColumns(typeInfo);
	const keys = Object.keys(values[0]).filter((x) => x in columns);
	// @ts-expect-error: drizzle internal
	const casing = db.dialect.casing as CasingCache;
	const dbNames = Object.fromEntries(
		Object.entries(columns).map(([k, v]) => [k, casing.getColumnCasing(v)]),
	);
	const vals = values.reduce(
		(acc, cur, i) => {
			for (const k of keys) {
				if (k in cur) acc[k].push(cur[k]);
				else acc[k].push(null);
			}
			for (const k of Object.keys(cur)) {
				if (k in acc) continue;
				if (!(k in columns)) continue;
				keys.push(k);
				acc[k] = new Array(i).fill(null);
				acc[k].push(cur[k]);
			}
			return acc;
		},
		Object.fromEntries(keys.map((x) => [x, [] as unknown[]])),
	);
	const computed = Object.entries(columns)
		.filter(([k, v]) => (v.defaultFn || v.onUpdateFn) && !keys.includes(k))
		.map(([k]) => k);
	return db
		.select(
			Object.fromEntries([
				...keys.map((x) => [x, sql.raw(`"${dbNames[x]}"`)]),
				...computed.map((x) => [
					x,
					(columns[x].defaultFn?.() ?? columns[x].onUpdateFn!()).as(dbNames[x]),
				]),
			]) as {
				[k in keyof typeof typeInfo.$inferInsert]-?: SQL.Aliased<
					(typeof typeInfo.$inferInsert)[k]
				>;
			},
		)
		.from(
			sql`unnest(${sql.join(
				keys.map(
					(k) =>
						sql`${sqlarr(vals[k])}${sql.raw(`::${columns[k].getSQLType()}[]`)}`,
				),
				sql.raw(", "),
			)}) as v(${sql.raw(keys.map((x) => `"${dbNames[x]}"`).join(", "))})`,
		);
};

export const unnest = <T extends Record<string, unknown>>(
	values: T[],
	name: string,
	typeInfo: Record<keyof T, string>,
) => {
	const keys = Object.keys(typeInfo);
	const vals = values.reduce(
		(acc, cur) => {
			for (const k of keys) {
				if (k in cur) acc[k].push(cur[k]);
				else acc[k].push(null);
			}
			return acc;
		},
		Object.fromEntries(keys.map((x) => [x, [] as unknown[]])),
	);
	return sql`unnest(${sql.join(
		keys.map((k) => sql`${sqlarr(vals[k])}${sql.raw(`::${typeInfo[k]}[]`)}`),
		sql.raw(", "),
	)}) as ${sql.raw(name)}(${sql.raw(keys.map((x) => `"${x}"`).join(", "))})`;
};

export const coalesce = <T>(val: SQL<T> | SQLWrapper, def: SQL<T> | Column) => {
	return sql<T>`coalesce(${val}, ${def})`;
};

export const nullif = <T>(val: SQL<T> | Column, eq: SQL<T>) => {
	return sql<T>`nullif(${val}, ${eq})`;
};

export const jsonbObjectAgg = <T>(
	key: SQLWrapper,
	value: SQL<T> | SQLWrapper,
) => {
	return sql<
		Record<string, T>
	>`jsonb_object_agg(${sql.join([key, value], sql.raw(","))})`;
};

export const jsonbAgg = <T>(val: SQL<T> | SQLWrapper) => {
	return sql<T[]>`jsonb_agg(${val})`;
};

type JsonFields = {
	[k: string]:
		| SelectedFieldsFlat[string]
		| Table
		| SelectedFieldsFlat
		| JsonFields;
};
export const jsonbBuildObject = <T>(select: JsonFields) => {
	const query = sql.join(
		Object.entries(select).flatMap(([k, v]) => {
			if (v.getSQL) return [sql.raw(`'${k}'`), v];
			// nested object (getSql is present in all SqlWrappers)
			return [sql.raw(`'${k}'`), jsonbBuildObject<any>(v as JsonFields)];
		}),
		sql.raw(", "),
	);
	return sql<T>`jsonb_build_object(${query})`;
};

export const isUniqueConstraint = (e: unknown): boolean => {
	if (typeof e !== "object" || !e || !("cause" in e)) return false;
	const cause = e.cause;
	return (
		typeof cause === "object" &&
		cause != null &&
		"code" in cause &&
		cause.code === "23505"
	);
};
