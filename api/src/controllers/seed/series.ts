import { t } from "elysia";
import type { SeedSerie } from "~/models/serie";
import { getYear } from "~/utils";
import { insertShow } from "./insert/shows";
import { guessNextRefresh } from "./refresh";
import { insertEntries } from "./insert/entries";

export const SeedSerieResponse = t.Object({
	id: t.String({ format: "uuid" }),
	slug: t.String({ format: "slug", examples: ["bubble"] }),
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

	const { translations, seasons, entries, ...serie } = seed;
	const nextRefresh = guessNextRefresh(serie.startAir ?? new Date());

	const ret = await insertShow(
		{
			kind: "serie",
			nextRefresh,
			...serie,
		},
		translations,
	);
	if ("status" in ret) return ret;

	const retEntries = await insertEntries(ret.pk, entries);

	return {
		updated: ret.updated,
		id: ret.id,
		slug: ret.slug,
	};
};
