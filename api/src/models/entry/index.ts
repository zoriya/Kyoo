import { t } from "elysia";
import {
	Episode,
	MovieEntry,
	SeedEpisode,
	SeedMovieEntry,
	SeedSpecial,
	Special,
} from "../entry";

export const Entry = t.Union([Episode, MovieEntry, Special]);
export type Entry = typeof Entry.static;

export const SeedEntry = t.Union([SeedEpisode, SeedMovieEntry, SeedSpecial]);
export type SeedEntry = typeof SeedEntry.static;

export * from "./episode";
export * from "./movie-entry";
export * from "./special";
export * from "./extra";
export * from "./unknown-entry";
