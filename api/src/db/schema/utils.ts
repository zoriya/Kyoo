import {
	is,
	type ColumnsSelection,
	type Subquery,
	Table,
	View,
	ViewBaseConfig,
	getTableColumns,
	sql,
	SQL,
} from "drizzle-orm";
import type { AnyMySqlSelect } from "drizzle-orm/mysql-core";
import {
	type AnyPgSelect,
	jsonb,
	pgSchema,
	varchar,
} from "drizzle-orm/pg-core";
import type { AnySQLiteSelect } from "drizzle-orm/sqlite-core";
import type { WithSubquery } from "drizzle-orm/subquery";
import { db } from "..";
import { CasingCache } from "drizzle-orm/casing";

export const schema = pgSchema("kyoo");

export const language = () => varchar({ length: 255 });

export const image = () =>
	jsonb().$type<{ id: string; source: string; blurhash: string }>();

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
			// @ts-ignore: drizzle internal
			const name = (db.dialect.casing as CasingCache).getColumnCasing(col);
			acc[colName as keyof typeof acc] = sql.raw(`excluded."${name}"`);
			return acc;
		},
		{} as Omit<Record<keyof T["_"]["columns"], SQL>, E[number]>,
	);
}
