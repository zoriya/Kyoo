import {
	type ColumnsSelection,
	type SQL,
	type Subquery,
	Table,
	View,
	ViewBaseConfig,
	getTableColumns,
	is,
	sql,
} from "drizzle-orm";
import type { CasingCache } from "drizzle-orm/casing";
import type { AnyMySqlSelect } from "drizzle-orm/mysql-core";
import type { AnyPgSelect } from "drizzle-orm/pg-core";
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
// TODO: type values (everything is a `text` for now)
export function values(items: Record<string, unknown>[]) {
	const [firstProp, ...props] = Object.keys(items[0]);
	const values = items
		.map((x) => {
			let ret = sql`(${x[firstProp]}`;
			for (const val of props) {
				ret = sql`${ret}, ${x[val]}`;
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
