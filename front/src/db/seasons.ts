import { Season } from "~/models";
import { kyooCollection } from "./kyoo";

export type SeasonRow = Season & { showSlug?: string };

export const seasons = kyooCollection<Season, SeasonRow>({
	id: "seasons",
	item: Season,
	getKey: (x) => x.id,
	fields: { seasonNumber: "seasonNumber" },
	routes: [{ path: "/api/series/:show/seasons", bind: { show: "showSlug" } }],
	indexes: [(x) => x.seasonNumber],
	normalize: (season) => season,
});
