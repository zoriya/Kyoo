import type { NonEmptyArray, Sort } from "./sort";
import { eq, or, type Column, and, gt, lt } from "drizzle-orm";

type Table<Name extends string> = Record<Name, Column>;

type After = (string | number | boolean | undefined)[];

// Create a filter (where) expression on the query to skip everything before/after the referenceID.
// The generalized expression for this in pseudocode is:
//   (x > a) OR
//   (x = a AND y > b) OR
//   (x = a AND y = b AND z > c) OR...
//
// Of course, this will be a bit more complex when ASC and DESC are mixed.
// Assume x is ASC, y is DESC, and z is ASC:
//   (x > a) OR
//   (x = a AND y < b) OR
//   (x = a AND y = b AND z > c) OR...
export const keysetPaginate = <
	const T extends NonEmptyArray<string>,
	const Remap extends Partial<Record<T[number], string>>,
>({
	table,
	sort,
	after,
}: {
	table: Table<"pk" | Sort<T, Remap>[number]["key"]>;
	after: string | undefined;
	sort: Sort<T, Remap>;
}) => {
	if (!after) return undefined;
	const cursor: After = JSON.parse(
		Buffer.from(after, "base64").toString("utf-8"),
	);

	const pkSort = { key: "pk" as const, desc: false };

	// TODO: Add an outer query >= for perf
	// PERF: See https://use-the-index-luke.com/sql/partial-results/fetch-next-page#sb-equivalent-logic
	let where = undefined;
	let previous = undefined;
	for (const [i, by] of [...sort, pkSort].entries()) {
		const cmp = by.desc ? lt : gt;
		where = or(where, and(previous, cmp(table[by.key], cursor[i])));
		previous = and(previous, eq(table[by.key], cursor[i]));
	}

	return where;
};

export const generateAfter = (cursor: any, sort: Sort<any, any>) => {
	const ret = [...sort.map((by) => cursor[by.key]), cursor.pk];
	return Buffer.from(JSON.stringify(ret), "utf-8").toString("base64url");
};
