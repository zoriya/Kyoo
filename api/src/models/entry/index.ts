import { t } from "elysia";
import { EntryTranslation as BaseEntryTranslation } from "./base-entry";
import { Episode, SeedEpisode } from "./episode";
import type { Extra } from "./extra";
import {
	MovieEntry,
	MovieEntryTranslation,
	SeedMovieEntry,
} from "./movie-entry";
import { SeedSpecial, Special } from "./special";

export const Entry = t.Union([Episode, MovieEntry, Special]);
export type Entry = Episode | MovieEntry | Special;

export const SeedEntry = t.Union([SeedEpisode, SeedMovieEntry, SeedSpecial]);
export type SeedEntry = SeedEpisode | SeedMovieEntry | SeedSpecial;

export type EntryKind = Entry["kind"] | Extra["kind"];

export const EntryTranslation = t.Union([
	BaseEntryTranslation(),
	MovieEntryTranslation,
]);
export type EntryTranslation = typeof EntryTranslation.static;

export * from "./episode";
export * from "./extra";
export * from "./movie-entry";
export * from "./special";
