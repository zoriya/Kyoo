import { type SQL, type Subquery, sql } from "drizzle-orm";
import type { SelectResultField } from "drizzle-orm/query-builders/select.types";

export const buildRelations = <
	R extends string,
	P extends object,
	Rel extends Record<R, (params: P) => Subquery>,
>(
	enabled: R[],
	relations: Rel,
	params?: P,
) => {
	// we wrap that in a sql`` instead of using the builder because of this issue
	// https://github.com/drizzle-team/drizzle-orm/pull/1674
	return Object.fromEntries(
		enabled.map((x) => [x, sql`${relations[x](params!)}`]),
	) as {
		[P in R]: SQL<
			ReturnType<Rel[P]>["_"]["selectedFields"] extends {
				[key: string]: infer TValue;
			}
				? SelectResultField<TValue>
				: never
		>;
	};
};
