import {
	type Column,
	type ColumnsSelection,
	getTableColumns,
	type InferSelectModel,
	is,
	isSQLWrapper,
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
	PgTable,
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

// See https://github.com/drizzle-team/drizzle-orm/issues/2842
export function rowToModel<
	TTable extends PgTable,
	TModel = InferSelectModel<TTable>,
>(row: Record<string, unknown>, table: TTable): TModel {
	// @ts-expect-error: drizzle internal
	const casing = db.dialect.casing as CasingCache;
	return Object.fromEntries(
		Object.entries(table).map(([schemaName, schema]) => [
			schemaName,
			schema.mapFromDriverValue?.(row[casing.getColumnCasing(schema)] ?? null),
		]),
	) as TModel;
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
	function escapeStr(str: string) {
		return str.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
	}

	// we treat arrays as object to have them as jsonb arrays instead of pg arrays.
	// nested arrays doesn't work well with unnest anyways.
	return `{${array
		.map((item) =>
			item === "null" || item === null || item === undefined
				? "null"
				: typeof item === "object"
					? `"${escapeStr(JSON.stringify(item))}"`
					: `"${escapeStr(item.toString())}"`,
		)
		.join(", ")}}`;
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
				...computed.map((x) => {
					let def = columns[x].defaultFn?.() ?? columns[x].onUpdateFn!();
					if (!isSQLWrapper(def)) def = sql`${def}`;
					return [x, def.as(dbNames[x])];
				}),
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
