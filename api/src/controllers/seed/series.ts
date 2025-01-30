import { t } from "elysia";
import type { SeedSerie } from "~/models/serie";
import { getYear } from "~/utils";
import { insertEntries } from "./insert/entries";
import { insertSeasons } from "./insert/seasons";
import { insertShow } from "./insert/shows";
import { guessNextRefresh } from "./refresh";

export const SeedSerieResponse = t.Object({
	id: t.String({ format: "uuid" }),
	slug: t.String({ format: "slug", examples: ["made-in-abyss"] }),
	seasons: t.Array(
		t.Object({
			id: t.String({ format: "uuid" }),
			slug: t.String({ format: "slug", examples: ["made-in-abyss-s1"] }),
		}),
	),
	entries: t.Array(
		t.Object({
			id: t.String({ format: "uuid" }),
			slug: t.String({ format: "slug", examples: ["made-in-abyss-s1e1"] }),
			videos: t.Array(
				t.Object({
					slug: t.String({
						format: "slug",
						examples: ["mode-in-abyss-s1e1v2"],
					}),
				}),
			),
		}),
	),
	extras: t.Array(
		t.Object({
			id: t.String({ format: "uuid" }),
			slug: t.String({ format: "slug", examples: ["made-in-abyss-s1e1"] }),
		}),
	),
});
export type SeedSerieResponse = typeof SeedSerieResponse.static;

export const seedSerie = async (
	seed: SeedSerie,
): Promise<
	| (SeedSerieResponse & { updated: boolean })
	| { status: 409; id: string; slug: string }
	| { status: 422; message: string }
> => {
	if (seed.slug === "random") {
		if (!seed.startAir) {
			return {
				status: 422,
				message: "`random` is a reserved slug. Use something else.",
			};
		}
		seed.slug = `random-${getYear(seed.startAir)}`;
	}

	const { translations, seasons, entries, extras, ...serie } = seed;
	const nextRefresh = guessNextRefresh(serie.startAir ?? new Date());

	const show = await insertShow(
		{
			kind: "serie",
			nextRefresh,
			...serie,
		},
		translations,
	);
	if ("status" in show) return show;

	const retSeasons = await insertSeasons(show, seasons);
	const retEntries = await insertEntries(show, entries);
	const retExtras = await insertEntries(
		show,
		(extras ?? []).map((x) => ({ ...x, kind: "extra", extraKind: x.kind })),
	);

	return {
		updated: show.updated,
		id: show.id,
		slug: show.slug,
		seasons: retSeasons,
		entries: retEntries,
		extras: retExtras,
	};
};
