import { type Column, and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import type { NonEmptyArray, Sort } from "./sort";

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
	table: Table<"pk" | Sort<T, Remap>["sort"][number]["key"]>;
	after: string | undefined;
	sort: Sort<T, Remap>;
}) => {
	if (!after) return undefined;
	const cursor: After = JSON.parse(
		Buffer.from(after, "base64").toString("utf-8"),
	);

	const pkSort = { key: "pk" as const, desc: false };

	if (sort.random) {
		return or(
			gt(
				sql`md5(${sort.random.seed} || ${table[pkSort.key]})`,
				sql`md5(${sort.random.seed} || ${cursor[0]})`,
			),
			and(
				eq(
					sql`md5(${sort.random.seed} || ${table[pkSort.key]})`,
					sql`md5(${sort.random.seed} || ${cursor[0]})`,
				),
				gt(table[pkSort.key], cursor[0]),
			),
		);
	}

	// TODO: Add an outer query >= for perf
	// PERF: See https://use-the-index-luke.com/sql/partial-results/fetch-next-page#sb-equivalent-logic
	let where = undefined;
	let previous = undefined;

	for (const [i, by] of [...sort.sort, pkSort].entries()) {
		const cmp = by.desc ? lt : gt;
		where = or(
			where,
			and(
				previous,
				or(
					cmp(table[by.key], cursor[i]),
					!table[by.key].notNull ? isNull(table[by.key]) : undefined,
				),
			),
		);
		previous = and(
			previous,
			cursor[i] === null ? isNull(table[by.key]) : eq(table[by.key], cursor[i]),
		);
	}

	return where;
};

export const generateAfter = <
	const ST extends NonEmptyArray<string>,
	const Remap extends Partial<Record<ST[number], string>> = never,
>(
	cursor: any,
	sort: Sort<ST, Remap>,
) => {
	const ret = [
		...sort.sort.map((by) => cursor[by.remmapedKey ?? by.key]),
		cursor.pk,
	];
	return Buffer.from(JSON.stringify(ret), "utf-8").toString("base64url");
};
