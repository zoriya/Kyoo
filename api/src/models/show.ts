import { t } from "elysia";

export const ShowStatus = t.UnionEnum([
	"unknown",
	"finished",
	"airing",
	"planned",
]);
export type ShowStatus = typeof ShowStatus.static;

export const Genre = t.UnionEnum([
	"action",
	"adventure",
	"animation",
	"comedy",
	"crime",
	"documentary",
	"drama",
	"family",
	"fantasy",
	"history",
	"horror",
	"music",
	"mystery",
	"romance",
	"science-fiction",
	"thriller",
	"war",
	"western",
	"kids",
	"reality",
	"politics",
	"soap",
	"talk",
]);
export type Genre = typeof Genre.static;
