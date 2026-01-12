import { Value } from "@sinclair/typebox/value";
import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { t } from "elysia";
import type { Sort } from "./sort";

type After = (string | number | boolean | Date | undefined)[];

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
export const keysetPaginate = ({
	sort,
	after,
}: {
	sort: Sort | undefined;
	after: string | undefined;
}) => {
	if (!after || !sort) return undefined;
	const cursor: After = JSON.parse(
		Buffer.from(after, "base64").toString("utf-8"),
	);

	const pkSort = {
		sql: sort.tablePk,
		isNullable: false,
		accessor: (x: any) => x.pk,
		desc: false,
	};

	if (sort.random) {
		return or(
			gt(
				sql`md5(${sort.random.seed} || ${sort.tablePk})`,
				sql`md5(${sort.random.seed} || ${cursor[0]})`,
			),
			and(
				eq(
					sql`md5(${sort.random.seed} || ${sort.tablePk})`,
					sql`md5(${sort.random.seed} || ${cursor[0]})`,
				),
				gt(sort.tablePk, cursor[0]),
			),
		);
	}

	// TODO: Add an outer query >= for perf
	// PERF: See https://use-the-index-luke.com/sql/partial-results/fetch-next-page#sb-equivalent-logic
	let where = undefined;
	let previous = undefined;

	for (const [i, by] of [...sort.sort, pkSort].entries()) {
		if (Value.Check(t.String({ format: "date-time" }), cursor[i]))
			cursor[i] = new Date(cursor[i]);
		const cmp = by.desc ? lt : gt;
		where = or(
			where,
			and(
				previous,
				or(cmp(by.sql, cursor[i]), by.isNullable ? isNull(by.sql) : undefined),
			),
		);
		previous = and(
			previous,
			cursor[i] === null ? isNull(by.sql) : eq(by.sql, cursor[i]),
		);
	}

	return where;
};

export const generateAfter = (cursor: any, sort: Sort) => {
	const ret = [...sort.sort.map((by) => by.accessor(cursor)), cursor.pk];
	return Buffer.from(JSON.stringify(ret), "utf-8").toString("base64url");
};
