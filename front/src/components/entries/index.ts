import type { Entry } from "~/models";

export * from "./entry-box";
export * from "./entry-line";

export const entryDisplayNumber = (entry: Entry) => {
	switch (entry.kind) {
		case "episode":
			return `S${entry.seasonNumber}:E${entry.episodeNumber}`;
		case "special":
			return `SP${entry.number}`;
		case "movie":
			return "";
		default:
			return "??";
	}
};
