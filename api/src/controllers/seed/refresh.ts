import type { SeedMovie } from "~/models/movie";
import type { SeedSerie } from "~/models/serie";

export const guessNextRefresh = (
	show:
		| (Omit<SeedSerie, "slug"> & { kind: "serie" })
		| (Omit<SeedMovie, "slug"> & { kind: "movie" }),
) => {
	if (show.kind === "movie") {
		return fromAirDate(show.airDate ?? new Date());
	}
	const dates = show.entries
		.filter((x) => x.airDate)
		.map((x) => new Date(x.airDate!));
	const after = dates.filter((x) => x.getTime() > Date.now());
	const lastAirDate =
		after.length > 0
			? after.reduce((min, cur) => (cur < min ? cur : min))
			: dates.reduce((max, cur) => (cur > max ? cur : max));
	return fromAirDate(lastAirDate);
};

// oh i hate js dates so much.
const fromAirDate = (airDate: string | Date) => {
	if (typeof airDate === "string") airDate = new Date(airDate);

	if (airDate.getTime() > Date.now()) {
		return airDate.toISOString().split("T")[0];
	}

	const diff = Date.now() - airDate.getTime();
	const days = diff / (24 * 60 * 60 * 1000);

	const ret = new Date();
	if (days <= 4) ret.setDate(ret.getDate() + 4);
	else if (days <= 21) ret.setDate(ret.getDate() + 14);
	else ret.setMonth(ret.getMonth() + 2);
	return ret.toISOString().split("T")[0];
};
