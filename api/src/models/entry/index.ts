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
export type Entry = Episode | MovieEntry | Special;

export const SeedEntry = t.Union([SeedEpisode, SeedMovieEntry, SeedSpecial]);
export type SeedEntry = SeedEpisode | SeedMovieEntry | SeedSpecial;

export * from "./episode";
export * from "./movie-entry";
export * from "./special";
export * from "./extra";
export * from "./unknown-entry";
