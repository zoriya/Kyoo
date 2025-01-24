import {
	type SQL,
	and,
	eq,
	gt,
	gte,
	lt,
	lte,
	ne,
	not,
	or,
	sql,
} from "drizzle-orm";
import { KErrorT } from "~/models/error";
import { comment } from "~/utils";
import type { FilterDef } from "./index";
import type { Expression, Operator } from "./parser";

const opMap: Record<Operator, typeof eq> = {
	eq: eq,
	ne: ne,
	gt: gt,
	ge: gte,
	lt: lt,
	le: lte,
	has: eq,
};

export const toDrizzle = (expr: Expression, config: FilterDef): SQL => {
	switch (expr.type) {
		case "op": {
			const where = `${expr.property} ${expr.operator} ${expr.value.value}`;
			const prop = config[expr.property];

			if (!prop) {
				throw new KErrorT(
					comment`
						Invalid property: ${expr.property}.
						Expected one of ${Object.keys(config).join(", ")}.
					`,
					{ in: where },
				);
			}

			if (expr.value.type === "enum" && prop.type === "string") {
				// promote enum to string since this is legal
				// but parser doesn't know if an enum should be a string
				expr.value = { type: "string", value: expr.value.value };
			}
			if (prop.type !== expr.value.type) {
				throw new KErrorT(
					comment`
						Invalid value for property ${expr.property}.
						Got ${expr.value.type} but expected ${prop.type}.
					`,
					{ in: where },
				);
			}
			if (
				prop.type === "enum" &&
				(expr.value.type === "enum" || expr.value.type === "string") &&
				!prop.values.includes(expr.value.value)
			) {
				throw new KErrorT(
					comment`
						Invalid value ${expr.value.value} for property ${expr.property}.
						Expected one of ${prop.values.join(", ")} but got ${expr.value.value}.
					`,
					{ in: where },
				);
			}

			if (prop.isArray) {
				if (expr.operator !== "has" && expr.operator !== "eq") {
					throw new KErrorT(
						comment`
							Property ${expr.property} is an array but you wanted to use the
							operator ${expr.operator}. Only "has" is supported ("eq" is also aliased to "has")
						`,
						{ in: where },
					);
				}
				return sql`${expr.value.value} = any(${prop.column})`;
			}
			return opMap[expr.operator](prop.column, expr.value.value);
		}
		case "and": {
			const lhs = toDrizzle(expr.lhs, config);
			const rhs = toDrizzle(expr.rhs, config);
			return and(lhs, rhs)!;
		}
		case "or": {
			const lhs = toDrizzle(expr.lhs, config);
			const rhs = toDrizzle(expr.rhs, config);
			return or(lhs, rhs)!;
		}
		case "not": {
			const lhs = toDrizzle(expr.expression, config);
			return not(lhs);
		}
		default:
			return exhaustiveCheck(expr);
	}
};

function exhaustiveCheck(v: never): never {
	return v;
}
