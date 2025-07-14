export * from "./entry-box";
export * from "./entry-list";

export const episodeDisplayNumber = (episode: {
	seasonNumber?: number | null;
	episodeNumber?: number | null;
	absoluteNumber?: number | null;
}) => {
	if (
		typeof episode.seasonNumber === "number" &&
		typeof episode.episodeNumber === "number"
	)
		return `S${episode.seasonNumber}:E${episode.episodeNumber}`;
	if (episode.absoluteNumber) return episode.absoluteNumber.toString();
	return "??";
};
