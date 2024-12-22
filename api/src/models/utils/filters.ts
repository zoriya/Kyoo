import {
	anyStringOf,
	digit,
	float,
	int,
	letter,
	noCharOf,
	type Parjser,
	string,
} from "parjs";
import {
	exactly,
	many,
	many1,
	map,
	or,
	stringify,
	then,
	thenq,
	qthen,
	later,
	between,
} from "parjs/combinators";
import type { KError } from "../error";

export type Filter = {
	[key: string]: any;
};

type Property = string;
type Value =
	| { type: "int"; value: number }
	| { type: "float"; value: number }
	| { type: "date"; value: string }
	| { type: "string"; value: string }
	| { type: "enum"; value: string };
const operators = ["eq", "ne", "gt", "ge", "lt", "le", "has", "in"] as const;
type Operator = (typeof operators)[number];
export type Expression =
	| { type: "op"; operator: Operator; property: Property; value: Value }
	| { type: "and"; lhs: Expression; rhs: Expression }
	| { type: "or"; lhs: Expression; rhs: Expression }
	| { type: "not"; expression: Expression };

function t<T>(parser: Parjser<T>): Parjser<T> {
	return parser.pipe(thenq(string(" ").pipe(many())));
}

const str = t(noCharOf(" ")).pipe(many1(), stringify()).expects("a string");
const enumP = t(letter()).pipe(many1(), stringify()).expects("an enum value");

const property = str.expects("a property");

const intVal = t(int().pipe(map((i) => ({ type: "int" as const, value: i }))));
const floatVal = t(
	float().pipe(map((f) => ({ type: "float" as const, value: f }))),
);
const dateVal = t(
	digit(10).pipe(
		exactly(4),
		thenq(string("-")),
		then(
			digit(10).pipe(exactly(2), thenq(string("-"))),
			digit(10).pipe(exactly(2)),
		),
		map(([year, month, day]) => ({
			type: "date" as const,
			value: `${year}-${month}-${day}`,
		})),
	),
);
const strVal = str.pipe(map((s) => ({ type: "string" as const, value: s })));
const enumVal = enumP.pipe(map((e) => ({ type: "enum" as const, value: e })));
const value = intVal
	.pipe(or(floatVal, dateVal, strVal, enumVal))
	.expects("a valid value");

const operator = t(anyStringOf(...operators)).expects("an operator");

const operation = property
	.pipe(
		then(operator, value),
		map(([property, operator, value]) => ({
			type: "op" as const,
			property,
			operator,
			value,
		})),
	)
	.expects("an operation");

export const expression = later<Expression>();

const not = t(string("not")).pipe(
	qthen(expression),
	map((expression) => ({ type: "not" as const, expression })),
);

const andor = operation.pipe(
	then(anyStringOf("and", "or").pipe(then(expression), many())),
	map(([first, expr]) =>
		expr.reduce<Expression>(
			(lhs, [op, rhs]) => ({ type: op, lhs, rhs }),
			first,
		),
	),
);

expression.init(
	not.pipe(or(operation, expression.pipe(or(andor), between("(", ")")))),
);

export const parseFilter = (
	filter: string,
	config: Filter,
): Expression | KError => {
	const ret = expression.parse(filter);
	if (ret.isOk) return ret.value;
	return { status: 422, message: `Invalid filter: ${filter}.`, details: ret };
};
