import { describe, expect, test } from "bun:test";
import {
	and,
	BaseQueryBuilder,
	createLiveQueryCollection,
	eq,
	gte,
	ilike,
	inArray,
	type IR,
	isNull,
	localOnlyCollectionOptions,
	not,
	or,
	createCollection,
} from "@tanstack/react-db";
import { entryFields } from "./entries";
import {
	parseFilter,
	randomOrder,
	serializeOrderBy,
	serializeWhere,
} from "./odata";
import { showFields } from "./shows";

type Row = Record<string, any>;
const col = createCollection(
	localOnlyCollectionOptions<Row>({ getKey: (x) => x.id }),
);
/** Build the IR the way a live query would (refs are `[alias, ...path]`). */
const where = (fn: (s: any) => IR.BasicExpression<boolean>) => {
	const q = new BaseQueryBuilder().from({ s: col }).where(({ s }) => fn(s));
	const clause = (q as any)._getQuery().where[0];
	return (clause.expression ?? clause) as IR.BasicExpression<boolean>;
};
const orderBy = (fn: (s: any) => any, dir: "asc" | "desc" = "asc") => {
	const q = new BaseQueryBuilder()
		.from({ s: col })
		.orderBy(({ s }) => fn(s), dir);
	return (q as any)._getQuery().orderBy as IR.OrderBy;
};

describe("serializeWhere", () => {
	test("comparisons, arrays and nesting", () => {
		expect(
			serializeWhere(
				where((s) =>
					and(
						eq(s.kind, "serie"),
						inArray("action", s.genres),
						or(
							gte(s.rating.themoviedatabase, 50),
							eq(s.watchStatus.status, "watching"),
						),
					),
				),
				showFields,
			),
		).toEqual({
			filter:
				"(kind eq serie and genres has action and (rating:themoviedatabase ge 50 or watchStatus eq watching))",
		});
	});

	test("in list, dates, quoted strings, not", () => {
		expect(
			serializeWhere(
				where((s) =>
					and(
						inArray(s.watchStatus.status, ["watching", "rewatching"]),
						not(eq(s.name, "Made in Abyss")),
						gte(s.startAir, new Date("2020-01-01")),
					),
				),
				showFields,
			).filter,
		).toBe(
			'((watchStatus eq watching or watchStatus eq rewatching) and not name eq "Made in Abyss" and startAir ge 2020-01-01)',
		);
	});

	test("search becomes the query param, null checks follow the field config", () => {
		expect(
			serializeWhere(
				where((e) =>
					and(
						ilike(e.name, "%abyss%"),
						not(isNull(e.availableSince)),
						not(isNull(e.progress.playedDate)),
					),
				),
				entryFields,
			),
		).toEqual({ filter: "isAvailable eq true", query: "abyss" });
	});

	test("unknown fields are programming errors", () => {
		expect(() =>
			serializeWhere(
				where((s) => eq(s.nope, 1)),
				showFields,
			),
		).toThrow();
	});
});

describe("serializeOrderBy", () => {
	test("maps local paths to server keys with direction", () => {
		expect(
			serializeOrderBy(
				orderBy((s) => s.name),
				showFields,
			),
		).toEqual(["name"]);
		expect(
			serializeOrderBy(
				orderBy((s) => s.watchStatus.lastPlayedAt, "desc"),
				showFields,
			),
		).toEqual(["-lastPlayed"]);
		expect(
			serializeOrderBy(
				orderBy((s) => randomOrder(s.id), "desc"),
				showFields,
			)[0],
		).toMatch(/^random:\d+$/);
	});
});

describe("parseFilter", () => {
	const roundtrip = (filter: string) =>
		serializeWhere(
			where((s) => parseFilter(filter, showFields)(s)),
			showFields,
		).filter;

	test("round trips the browse filters", () => {
		expect(roundtrip("kind eq serie and genres has action")).toBe(
			"(kind eq serie and genres has action)",
		);
		expect(
			roundtrip(
				"(rating:themoviedatabase ge 50 or status eq finished) and not genres has horror",
			),
		).toBe(
			"((rating:themoviedatabase ge 50 or status eq finished) and not genres has horror)",
		);
		expect(roundtrip('name eq "Made in Abyss"')).toBe(
			'name eq "Made in Abyss"',
		);
		expect(roundtrip("startAir ge 2020-01-01")).toBe("startAir ge 2020-01-01");
	});

	test("server only fields are forwarded verbatim, unknown keys throw", () => {
		expect(
			roundtrip("studios has mappa and staff has bob and kind eq serie"),
		).toBe("(studios has mappa and staff has bob and kind eq serie)");
		expect(() => parseFilter("nope eq 1", showFields)).toThrow();
	});

	test("null flags and ne", () => {
		const f = serializeWhere(
			where((e) =>
				parseFilter("isAvailable eq true and kind ne special", entryFields)(e),
			),
			entryFields,
		).filter;
		expect(f).toBe("(isAvailable eq true and not kind eq special)");
	});

	test("filters rows locally the same way, server only clauses pass", async () => {
		col.insert({
			id: "a",
			kind: "serie",
			genres: ["action"],
			rating: { tmdb: 80 },
		});
		col.insert({
			id: "b",
			kind: "movie",
			genres: ["drama"],
			rating: { tmdb: 20 },
		});
		const live = createLiveQueryCollection({
			startSync: true,
			query: (q) =>
				q
					.from({ s: col })
					.where(({ s }) =>
						parseFilter(
							"genres has action and rating:tmdb ge 50 and staff has bob",
							showFields,
						)(s),
					),
		});
		expect((await live.toArrayWhenReady()).map((x) => x.id)).toEqual(["a"]);
	});

	test("randomOrder is a seeded rotation of the uuid order", async () => {
		const ids = ["0a", "3b", "9c", "f0"].map(
			(x) => `${x}000000-0000-4000-8000-000000000000`,
		);
		for (const id of ids) col.insert({ id, kind: "rotation" });
		const live = createLiveQueryCollection({
			startSync: true,
			query: (q) =>
				q
					.from({ s: col })
					.where(({ s }) => eq(s.kind, "rotation"))
					.orderBy(({ s }) => randomOrder(s.id)),
		});
		const order = (await live.toArrayWhenReady()).map((x) => x.id);
		// a rotation: once wrapped around, ids keep their natural order
		const start = order.indexOf(ids[0]!);
		expect([...order.slice(start), ...order.slice(0, start)]).toEqual(ids);
	});

	test("rejects garbage", () => {
		expect(() => parseFilter("genres has", showFields)).toThrow();
		expect(() => parseFilter("kind eq", showFields)).toThrow();
	});
});
