import {
	and,
	caseWhen,
	concat,
	eq,
	gt,
	gte,
	inArray,
	type IR,
	isNull,
	lt,
	lte,
	not,
	or,
} from "@tanstack/react-db";

/**
 * Two way translation between live query expressions and kyoo's odata-like
 * `filter` / `sort` / `query` parameters.
 *
 * A collection describes its server keys once (`FieldMap`); the sync layer
 * turns the `where`/`orderBy` of a live query into request params, and the
 * browse page turns a user typed filter string into a `where` so the same
 * filter runs against the local db.
 */

export type FieldDef = {
	/** Path of the field on the local row, e.g. ["watchStatus", "status"]. */
	path: string[];
	/** Array field: `key has value` <-> `inArray(value, row.field)`. */
	array?: boolean;
	/** Parametrized key (`rating:tmdb`): the param is the next path segment. */
	param?: boolean;
	/** The server exposes `key eq true/false` for "field is (not) null". */
	nullFlag?: boolean;
	/** Null checks on this field are implied by the route, drop them. */
	ignoreNull?: boolean;
	/**
	 * The row has no data for this key (`staff has x` joins another table):
	 * the clause is forwarded to the api verbatim and always true locally.
	 */
	serverOnly?: boolean;
};
/** server key -> local field. A string is a dotted path shorthand. */
export type FieldMap = Record<string, string | FieldDef>;

type Field = FieldDef & { key: string };

const compile = (fields: FieldMap): Field[] =>
	Object.entries(fields).map(([key, def]) => ({
		key,
		...(typeof def === "string" ? { path: def.split(".") } : def),
	}));

const samePath = (a: string[], b: string[]) =>
	a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Live query refs are `[alias, ...path]`, sync options may already be stripped.
 * Several server keys can point to one field (`availableSince` to sort,
 * `isAvailable` for null checks): `prefer` picks between them.
 */
const fieldOf = (
	fields: Field[],
	ref: IR.PropRef,
	prefer: (f: Field) => boolean = () => true,
) => {
	const candidates = [
		...fields.filter(prefer),
		...fields.filter((f) => !prefer(f)),
	];
	for (const path of [ref.path, ref.path.slice(1)]) {
		for (const f of candidates) {
			if (samePath(f.path, path)) return { field: f, key: f.key };
			if (
				f.param &&
				path.length === f.path.length + 1 &&
				samePath(f.path, path.slice(0, -1))
			)
				return { field: f, key: `${f.key}:${path[path.length - 1]}` };
		}
	}
	return undefined;
};

const formatValue = (value: unknown): string => {
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	if (typeof value === "string")
		return /^[\w-]+$/.test(value) ? value : `"${value.replaceAll('"', "")}"`;
	return String(value);
};

/**
 * Random order, the way the api does it (`sort=random:seed` sorts by
 * `md5(seed || pk)`): a seeded permutation that is stable for the session so
 * pagination and re-renders agree, and different on the next launch.
 *
 * md5 is not available in live queries, but ids are uuid v4 (already a random
 * permutation): rotating that order at a seeded pivot gives a new start every
 * launch. Use it as `orderBy(({ s }) => randomOrder(s.id))`.
 */
const seed = Math.floor(Math.random() * 2 ** 31);
const pivot = seed.toString(16).padStart(8, "0");
export const randomOrder = (id: any) =>
	concat(caseWhen(gt(id, pivot), "0", "1"), id);

const isRandomOrder = (e: IR.BasicExpression) =>
	e.type === "func" &&
	e.name === "concat" &&
	e.args[0]?.type === "func" &&
	e.args[0].name === "caseWhen";

export type ServerParams = { filter?: string; query?: string; sort?: string[] };

/**
 * A clause the api evaluates but the local rows can't (`serverOnly` field):
 * carried as `eq("staff has bob", "staff has bob")`, true locally.
 */
const serverClause = (clause: string) => eq(clause, clause);
const isServerClause = (e: IR.BasicExpression) =>
	e.type === "func" &&
	e.name === "eq" &&
	e.args.length === 2 &&
	e.args.every((a) => a.type === "val" && typeof a.value === "string") &&
	(e.args[0] as IR.Value).value === (e.args[1] as IR.Value).value;

const operators: Record<string, string> = {
	eq: "eq",
	gt: "gt",
	gte: "ge",
	lt: "lt",
	lte: "le",
};

/**
 * `where` -> `{ filter, query }`. Throws when the expression can't be served
 * by the api, which is a programming error in the live query.
 */
export const serializeWhere = (
	where: IR.BasicExpression<boolean> | undefined,
	fieldMap: FieldMap,
): Pick<ServerParams, "filter" | "query"> => {
	const fields = compile(fieldMap);
	let query: string | undefined;

	const nullable = (f: Field) => !!(f.nullFlag || f.ignoreNull);
	const refOf = (e: IR.BasicExpression, prefer?: (f: Field) => boolean) => {
		if (e.type !== "ref") return undefined;
		const f = fieldOf(fields, e, prefer);
		if (!f) throw new Error(`No server field for ${e.path.join(".")}`);
		return f;
	};
	const visit = (e: IR.BasicExpression | undefined): string | undefined => {
		if (!e || e.type !== "func") return undefined;
		switch (e.name) {
			case "and":
			case "or": {
				const parts = e.args.map(visit).filter((x) => x !== undefined);
				if (parts.length === 0) return undefined;
				if (parts.length === 1) return parts[0];
				return `(${parts.join(` ${e.name} `)})`;
			}
			case "not": {
				const [arg] = e.args;
				if (arg?.type === "func" && arg.name === "isNull") {
					const f = refOf(arg.args[0]!, nullable);
					if (f?.field.ignoreNull) return undefined;
					if (f?.field.nullFlag) return `${f.key} eq true`;
				}
				const inner = visit(arg);
				return inner === undefined ? undefined : `not ${inner}`;
			}
			case "isNull": {
				const f = refOf(e.args[0]!, nullable);
				if (f?.field.ignoreNull) return undefined;
				if (f?.field.nullFlag) return `${f.key} eq false`;
				throw new Error(`isNull is not supported on ${f?.key}`);
			}
			case "in": {
				const [left, right] = e.args as [
					IR.BasicExpression,
					IR.BasicExpression,
				];
				if (left.type === "val" && right.type === "ref") {
					const f = refOf(right)!;
					return `${f.key} has ${formatValue(left.value)}`;
				}
				if (left.type === "ref" && right.type === "val") {
					const f = refOf(left)!;
					const values = right.value as unknown[];
					if (values.length === 0) return undefined;
					return `(${values.map((v) => `${f.key} eq ${formatValue(v)}`).join(" or ")})`;
				}
				throw new Error("Unsupported `in` expression");
			}
			case "like":
			case "ilike": {
				const [, right] = e.args;
				if (right?.type !== "val")
					throw new Error("Unsupported like expression");
				query = String(right.value).replaceAll("%", "");
				return undefined;
			}
			default: {
				const op = operators[e.name];
				if (!op) throw new Error(`Unsupported operator ${e.name}`);
				const [a, b] = e.args as [IR.BasicExpression, IR.BasicExpression];
				if (isServerClause(e)) return String((a as IR.Value).value);
				const [ref, val] = a.type === "ref" ? [a, b] : [b, a];
				if (ref.type !== "ref" || val.type !== "val")
					throw new Error(`Unsupported operands for ${e.name}`);
				const f = refOf(ref)!;
				return `${f.key} ${op} ${formatValue(val.value)}`;
			}
		}
	};
	const filter = visit(where);
	return { filter, query };
};

export const serializeOrderBy = (
	orderBy: IR.OrderBy | undefined,
	fieldMap: FieldMap,
): string[] => {
	const fields = compile(fieldMap);
	return (orderBy ?? []).map((clause) => {
		// the api has no `-random`, the direction only matters locally
		if (isRandomOrder(clause.expression)) return `random:${seed}`;
		if (clause.expression.type !== "ref")
			throw new Error("Only fields can be sorted server side");
		const f = fieldOf(fields, clause.expression);
		if (!f)
			throw new Error(`No server sort for ${clause.expression.path.join(".")}`);
		return `${clause.compareOptions.direction === "desc" ? "-" : ""}${f.key}`;
	});
};

/**
 * Parse a kyoo filter string (`genres has action and rating:tmdb ge 50`) into
 * a `where` callback usable on a live query: `.where(({ s }) => filter(s))`.
 *
 * Grammar (same as the api): or > and > not > (expr) | property op value.
 */
export const parseFilter = (
	filter: string,
	fieldMap: FieldMap,
): ((row: any) => IR.BasicExpression<boolean>) => {
	const fields = compile(fieldMap);
	const tokens = filter.match(/\(|\)|"[^"]*"|'[^']*'|[^\s()]+/g) ?? [];
	let i = 0;
	const peek = () => tokens[i];
	const next = () => {
		const t = tokens[i];
		if (t === undefined) throw new Error("Unexpected end of filter");
		i++;
		return t;
	};

	const parseValue = (raw: string): unknown => {
		if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(raw);
		if (/^-?\d+$/.test(raw)) return Number.parseInt(raw, 10);
		if (/^-?\d+\.\d+$/.test(raw)) return Number.parseFloat(raw);
		if (raw === "true" || raw === "false") return raw === "true";
		if (/^(".*"|'.*')$/.test(raw)) return raw.slice(1, -1);
		return raw;
	};

	const comparison = () => {
		const [name, param] = next().split(":", 2);
		const op = next();
		const value = parseValue(next());
		const field = fields.find((f) => f.key === name);
		if (!field) throw new Error(`Unknown filter field: ${name}`);
		if (field.serverOnly) {
			const clause = serverClause(`${name} ${op} ${formatValue(value)}`);
			return () => clause;
		}
		const path = field.param && param ? [...field.path, param] : field.path;
		return (row: any) => {
			const ref = path.reduce((acc, k) => acc[k], row) as any;
			if (field.nullFlag) {
				if (op !== "eq") throw new Error(`${name} only supports eq`);
				return value ? not(isNull(ref)) : isNull(ref);
			}
			switch (op) {
				case "eq":
					return eq(ref, value);
				case "ne":
					return not(eq(ref, value));
				case "gt":
					return gt(ref, value);
				case "ge":
					return gte(ref, value);
				case "lt":
					return lt(ref, value);
				case "le":
					return lte(ref, value);
				case "has":
					return inArray(value as any, ref);
				default:
					throw new Error(`Unknown operator: ${op}`);
			}
		};
	};
	type Where = (row: any) => IR.BasicExpression<boolean>;
	const unary = (): Where => {
		if (peek() === "not") {
			next();
			const inner = unary();
			return (row) => not(inner(row));
		}
		if (peek() === "(") {
			next();
			const inner = expression();
			if (next() !== ")") throw new Error("Expected `)`");
			return inner;
		}
		return comparison();
	};
	const conjunction = (): Where => {
		const parts = [unary()];
		while (peek() === "and") {
			next();
			parts.push(unary());
		}
		return parts.length === 1
			? parts[0]!
			: (row) => and(...(parts.map((p) => p(row)) as [any, any, ...any[]]));
	};
	const expression = (): Where => {
		const parts = [conjunction()];
		while (peek() === "or") {
			next();
			parts.push(conjunction());
		}
		return parts.length === 1
			? parts[0]!
			: (row) => or(...(parts.map((p) => p(row)) as [any, any, ...any[]]));
	};

	const ret = expression();
	if (i !== tokens.length) throw new Error(`Unexpected token: ${tokens[i]}`);
	return ret;
};
