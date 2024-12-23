import {
	and,
	type Column,
	eq,
	gt,
	gte,
	lt,
	lte,
	ne,
	not,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import { comment } from "~/utils";
import type { KError } from "../error";
import { type Expression, expression, type Operator } from "./filters";

export type Filter = {
	[key: string]:
		| {
				column: Column;
				type: "int" | "float" | "date" | "string";
				isArray?: boolean;
		  }
		| { column: Column; type: "enum"; values: string[]; isArray?: boolean };
};

export const parseFilters = (filter: string | undefined, config: Filter) => {
	if (!filter) return undefined;
	const ret = expression.parse(filter);
	if (!ret.isOk) {
		throw new Error("todo");
		// return { status: 422, message: `Invalid filter: ${filter}.`, details: ret }
	}

	return toDrizzle(ret.value, config);
};

const opMap: Record<Operator, typeof eq> = {
	eq: eq,
	ne: ne,
	gt: gt,
	ge: gte,
	lt: lt,
	le: lte,
	has: eq,
};

const toDrizzle = (expr: Expression, config: Filter): SQL | KError => {
	switch (expr.type) {
		case "op": {
			const where = `${expr.property} ${expr.operator} ${expr.value}`;
			const prop = config[expr.property];

			if (!prop) {
				return {
					status: 422,
					message: comment`
						Invalid property: ${expr.property}.
						Expected one of ${Object.keys(config).join(", ")}.
					`,
					details: { in: where },
				};
			}

			if (prop.type !== expr.value.type) {
				return {
					status: 422,
					message: comment`
						Invalid value for property ${expr.property}.
						Got ${expr.value.type} but expected ${prop.type}.
					`,
					details: { in: where },
				};
			}
			if (
				prop.type === "enum" &&
				(expr.value.type === "enum" || expr.value.type === "string") &&
				!prop.values.includes(expr.value.value)
			) {
				return {
					status: 422,
					message: comment`
						Invalid value ${expr.value.value} for property ${expr.property}.
						Expected one of ${prop.values.join(", ")} but got ${expr.value.value}.
					`,
					details: { in: where },
				};
			}

			if (prop.isArray) {
				if (expr.operator !== "has" && expr.operator !== "eq") {
					return {
						status: 422,
						message: comment`
							Property ${expr.property} is an array but you wanted to use the
							operator ${expr.operator}. Only "has" is supported ("eq" is also aliased to "has")
						`,
						details: { in: where },
					};
				}
				return sql`${expr.value.value} = any(${prop.column})`;
			}
			return opMap[expr.operator](prop.column, expr.value.value);
		}
		case "and": {
			const lhs = toDrizzle(expr.lhs, config);
			const rhs = toDrizzle(expr.rhs, config);
			if ("status" in lhs) return lhs;
			if ("status" in rhs) return rhs;
			return and(lhs, rhs)!;
		}
		case "or": {
			const lhs = toDrizzle(expr.lhs, config);
			const rhs = toDrizzle(expr.rhs, config);
			if ("status" in lhs) return lhs;
			if ("status" in rhs) return rhs;
			return or(lhs, rhs)!;
		}
		case "not": {
			const lhs = toDrizzle(expr.expression, config);
			if ("status" in lhs) return lhs;
			return not(lhs);
		}
		default:
			return exhaustiveCheck(expr);
	}
};

function exhaustiveCheck(v: never): never {
	return v;
}
