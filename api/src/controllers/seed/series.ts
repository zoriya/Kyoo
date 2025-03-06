import { t } from "elysia";
import type { SeedSerie } from "~/models/serie";
import { getYear } from "~/utils";
import { insertCollection } from "./insert/collection";
import { insertEntries } from "./insert/entries";
import { insertSeasons } from "./insert/seasons";
import { insertShow } from "./insert/shows";
import { insertStudios } from "./insert/studios";
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
	collection: t.Nullable(
		t.Object({
			id: t.String({ format: "uuid" }),
			slug: t.String({
				format: "slug",
				examples: ["made-in-abyss-collection"],
			}),
		}),
	),
	studios: t.Array(
		t.Object({
			id: t.String({ format: "uuid" }),
			slug: t.String({ format: "slug", examples: ["mappa"] }),
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

	const {
		translations,
		seasons,
		entries,
		extras,
		collection,
		studios,
		...serie
	} = seed;
	const nextRefresh = guessNextRefresh(serie.startAir ?? new Date());

	const col = await insertCollection(collection, {
		kind: "serie",
		nextRefresh,
		...seed,
	});

	const show = await insertShow(
		{
			kind: "serie",
			nextRefresh,
			collectionPk: col?.pk,
			entriesCount: entries.length,
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

	const retStudios = await insertStudios(studios, show.pk);

	return {
		updated: show.updated,
		id: show.id,
		slug: show.slug,
		seasons: retSeasons,
		entries: retEntries,
		extras: retExtras,
		collection: col,
		studios: retStudios,
	};
};
