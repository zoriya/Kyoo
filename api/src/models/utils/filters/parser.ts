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
	recover,
} from "parjs/combinators";

export type Property = string;
export type Value =
	| { type: "int"; value: number }
	| { type: "float"; value: number }
	| { type: "date"; value: string }
	| { type: "string"; value: string }
	| { type: "enum"; value: string };
const operators = ["eq", "ne", "gt", "ge", "lt", "le", "has"] as const;
export type Operator = (typeof operators)[number];
export type Expression =
	| { type: "op"; operator: Operator; property: Property; value: Value }
	| { type: "and"; lhs: Expression; rhs: Expression }
	| { type: "or"; lhs: Expression; rhs: Expression }
	| { type: "not"; expression: Expression };

function t<T>(parser: Parjser<T>): Parjser<T> {
	return parser.pipe(thenq(string(" ").pipe(many())));
}

const str = t(noCharOf(" ").pipe(many1(), stringify()).expects("a string"));
const enumP = t(letter().pipe(many1(), stringify()).expects("an enum value"));

const property = str.expects("a property");

const intVal = t(int().pipe(map((i) => ({ type: "int" as const, value: i }))));
const floatVal = t(
	float().pipe(map((f) => ({ type: "float" as const, value: f }))),
);
const dateVal = t(
	digit(10).pipe(
		exactly(4),
		stringify(),
		thenq(string("-")),
		then(
			digit(10).pipe(exactly(2), stringify(), thenq(string("-"))),
			digit(10).pipe(exactly(2), stringify()),
		),
		map(([year, month, day]) => ({
			type: "date" as const,
			value: `${year}-${month}-${day}`,
		})),
	),
).expects("a date");
const strVal = str.pipe(
	between('"'),
	or(str.pipe(between("'"))),
	map((s) => ({ type: "string" as const, value: s })),
);
const enumVal = enumP.pipe(map((e) => ({ type: "enum" as const, value: e })));
const value = dateVal
	.pipe(
		// until we get the `-` character, this could be an int or a float.
		recover(() => ({ kind: "Soft" })),
		or(intVal, floatVal, strVal, enumVal),
	)
	.expects("a valid value");

const operator = t(anyStringOf(...operators)).expects("an operator");

export const operation = property
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

// grammar:
//
// operation = property operator value
// property = letter { letter }
// operator = "eq" | "lt" | ...
// value = ...
//
// expression = expr { binn expr }
// expr =
//   | "not" expr
//   | "(" expression ")"
//   | operation
// bin = "and" | "or"
//
const expr = later<Expression>();

export const expression = expr.pipe(
	then(t(anyStringOf("and", "or")).pipe(then(expr), many())),
	map(([first, expr]) =>
		expr.reduce<Expression>(
			(lhs, [op, rhs]) => ({ type: op, lhs, rhs }),
			first,
		),
	),
);

const not = t(string("not")).pipe(
	qthen(expr),
	map((expression) => ({ type: "not" as const, expression })),
);

const brackets = expression.pipe(between("(", ")"));

expr.init(not.pipe(or(brackets, operation)));
