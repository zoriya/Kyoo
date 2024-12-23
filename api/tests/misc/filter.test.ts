import { describe, expect, it } from "bun:test";
import type { ParjsFailure } from "parjs/internal";
import { type Expression, expression } from "~/models/utils/filters";

function parse(
	filter: string,
): { ok: true; value: Expression } | { ok: false } {
	const ret = expression.parse(filter);
	if (ret.isOk) return { ok: true, value: ret.value };
	const fail = ret as ParjsFailure;
	console.log(fail.toString());
	return {
		ok: false,
		reason: fail.reason,
		trace: {
			...fail.trace,
			location: fail.trace.location,
			leftover: fail.trace.input.substring(fail.trace.location.column),
		},
	} as any;
}

describe("Parse filter", () => {
	it("Handle eq", () => {
		const ret = parse("status eq finished");
		expect(ret).toMatchObject({
			ok: true,
			value: {
				type: "op",
				operator: "eq",
				property: "status",
				value: { type: "enum", value: "finished" },
			},
		});
	});
	it("Handle lt", () => {
		const ret = parse("rating lt 10");
		expect(ret).toMatchObject({
			ok: true,
			value: {
				type: "op",
				operator: "lt",
				property: "rating",
				value: { type: "int", value: 10 },
			},
		});
	});
	it("Handle dates", () => {
		const ret = parse("airDate ge 2022-10-12");
		expect(ret).toMatchObject({
			ok: true,
			value: {
				type: "op",
				operator: "ge",
				property: "airDate",
				value: { type: "date", value: "2022-10-12" },
			},
		});
	});
	it("Handle not", () => {
		const ret = parse("not rating lt 10");
		expect(ret).toMatchObject({
			ok: true,
			value: {
				type: "not",
				expression: {
					type: "op",
					operator: "lt",
					property: "rating",
					value: { type: "int", value: 10 },
				},
			},
		});
	});
	it("Handle top level brackets", () => {
		const ret = parse("(rating lt 10)");
		expect(ret).toMatchObject({
			ok: true,
			value: {
				type: "op",
				operator: "lt",
				property: "rating",
				value: { type: "int", value: 10 },
			},
		});
	});
	it("Handle top level brackets with not", () => {
		const ret = parse("(not rating lt 10)");
		expect(ret).toMatchObject({
			ok: true,
			value: {
				type: "not",
				expression: {
					type: "op",
					operator: "lt",
					property: "rating",
					value: { type: "int", value: 10 },
				},
			},
		});
	});
	it("Handle and", () => {
		const ret = parse("not rating lt 10 and rating lt 20");
		expect(ret).toMatchObject({
			ok: true,
			value: {
				type: "and",
				lhs: {
					type: "not",
					expression: {
						type: "op",
						operator: "lt",
						property: "rating",
						value: { type: "int", value: 10 },
					},
				},
				rhs: {
					type: "op",
					operator: "lt",
					property: "rating",
					value: { type: "int", value: 20 },
				},
			},
		});
	});
	it("Handle or", () => {
		const ret = parse(
			"not rating lt 10 and rating lt 20 or (status eq finished and not status ne airing)",
		);
		expect(ret).toMatchObject({
			ok: true,
			value: {
				type: "or",
				lhs: {
					type: "and",
					lhs: {
						type: "not",
						expression: {
							type: "op",
							operator: "lt",
							property: "rating",
							value: { type: "int", value: 10 },
						},
					},
					rhs: {
						type: "op",
						operator: "lt",
						property: "rating",
						value: { type: "int", value: 20 },
					},
				},
				rhs: {
					type: "and",
					lhs: {
						type: "op",
						operator: "eq",
						property: "status",
						value: { type: "enum", value: "finished" },
					},
					rhs: {
						type: "not",
						expression: {
							type: "op",
							operator: "ne",
							property: "status",
							value: { type: "enum", value: "airing" },
						},
					},
				},
			},
		});
	});
});
