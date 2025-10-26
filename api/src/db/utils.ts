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
	View,
	ViewBaseConfig,
} from "drizzle-orm";
import type { CasingCache } from "drizzle-orm/casing";
import type { AnyMySqlSelect } from "drizzle-orm/mysql-core";
import {
	type AnyPgSelect,
	customType,
	type SelectedFieldsFlat,
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
export function sqlarr(array: unknown[]) {
	return `{${array.map((item) => `"${item}"`).join(",")}}`;
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

export const timestamp = customType<{
	data: string;
	driverData: string;
	config: { withTimezone: boolean; precision?: number; mode: "iso" };
}>({
	dataType(config) {
		const precision = config?.precision ? ` (${config.precision})` : "";
		return `timestamp${precision}${config?.withTimezone ? " with time zone" : ""}`;
	},
	fromDriver(value: string): string {
		// postgres format: 2025-06-22 16:13:37.489301+00
		// what we want:    2025-06-22T16:13:37Z
		return `${value.substring(0, 10)}T${value.substring(11, 19)}Z`;
	},
});
