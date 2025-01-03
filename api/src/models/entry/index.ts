import { t } from "elysia";
import { Episode, MovieEntry, Special } from "../entry";

export const Entry = t.Union([Episode, MovieEntry, Special]);
export type Entry = typeof Entry.static;

export * from "./episode";
export * from "./movie-entry";
export * from "./special";
export * from "./extra";
export * from "./unknown-entry";
