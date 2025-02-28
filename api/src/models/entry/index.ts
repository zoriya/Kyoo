import { t } from "elysia";
import { Episode, SeedEpisode } from "./episode";
import type { Extra } from "./extra";
import { MovieEntry, SeedMovieEntry } from "./movie-entry";
import { SeedSpecial, Special } from "./special";
import type { UnknownEntry } from "./unknown-entry";

export const Entry = t.Union([Episode, MovieEntry, Special]);
export type Entry = Episode | MovieEntry | Special;

export const SeedEntry = t.Union([SeedEpisode, SeedMovieEntry, SeedSpecial]);
export type SeedEntry = SeedEpisode | SeedMovieEntry | SeedSpecial;

export type EntryKind = Entry["kind"] | Extra["kind"] | UnknownEntry["kind"];

export * from "./episode";
export * from "./movie-entry";
export * from "./special";
export * from "./extra";
export * from "./unknown-entry";
