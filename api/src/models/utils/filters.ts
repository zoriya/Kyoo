import { digit, float, int, noCharOf, type Parjser, string } from "parjs";
import {
	exactly,
	many,
	many1,
	map,
	or,
	stringify,
	then,
	thenq,
} from "parjs/combinators";

export type Filter = {
	[key: string]: any;
};

type Property = string;
type Value =
	| { type: "int"; value: number }
	| { type: "float"; value: number }
	| { type: "date"; value: string }
	| { type: "string"; value: string };
type Operator = "eq" | "ne" | "gt" | "ge" | "lt" | "le" | "has" | "in";
type Expression =
	| { type: "op"; operator: Operator; property: Property; value: Value }
	| { type: "and"; first: Expression; second: Expression }
	| { type: "or"; first: Expression; second: Expression }
	| { type: "not"; expression: Expression };

function t<T>(parser: Parjser<T>): Parjser<T> {
	return parser.pipe(thenq(string(" ").pipe(many())));
}

const str = t(noCharOf(" ")).pipe(many1(), stringify()).expects("a string");
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
const strVal = t(str.pipe(map((s) => ({ type: "string" as const, value: s }))));
const value = intVal
	.pipe(or(floatVal, dateVal, strVal))
	.expects("a valid value");

const operator = null;

export const parseFilter = (filter: string, config: Filter) => {};
