import type { Column, SQL } from "drizzle-orm";
import { t } from "elysia";
import { KErrorT } from "~/models/error";
import { comment } from "~/utils";
import { expression } from "./parser";
import { toDrizzle } from "./to-sql";

export type FilterDef = {
	[key: string]:
		| {
				column: Column | SQL;
				type: "int" | "float" | "date" | "string";
				isArray?: boolean;
		  }
		| {
				column: Column | SQL;
				type: "enum";
				values: string[];
				isArray?: boolean;
		  };
};

export const Filter = ({
	def,
	description = "Filters to apply to the query.",
}: { def: FilterDef; description?: string }) =>
	t
		.Transform(
			t.String({
				description: comment`
					${description}

					This is based on [odata's filter specification](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_SystemQueryOptionfilter).
					Filters available: ${Object.keys(def).join(", ")}.
				`,
				example: "(rating gt 75 and genres has action) or status eq planned",
			}),
		)
		.Decode((filter) => {
			return parseFilters(filter, def);
		})
		.Encode(() => {
			throw new Error("Can't encode filters");
		});

export const parseFilters = (filter: string | undefined, config: FilterDef) => {
	if (!filter) return undefined;
	const ret = expression.parse(filter);
	if (!ret.isOk) {
		throw new KErrorT(`Invalid filter: ${filter}.`, ret);
	}

	return toDrizzle(ret.value, config);
};
