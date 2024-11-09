import { t } from "elysia";
import { Image } from "./utils/image";
import { SeasonId } from "./utils/external-id";

export const Season = t.Object({
	id: t.String({ format: "uuid" }),
	slug: t.String(),
	seasonNumber: t.Number({ minimum: 1 }),
	name: t.Nullable(t.String()),
	description: t.Nullable(t.String()),

	poster: t.Nullable(Image),
	thumbnail: t.Nullable(Image),
	banner: t.Nullable(Image),
	logo: t.Nullable(Image),
	trailerUrl: t.Nullable(t.String()),

	createdAt: t.String({ format: "date-time" }),
	nextRefresh: t.String({ format: "date-time" }),

	externalId: SeasonId,
});
export type Season = typeof Season.static;
