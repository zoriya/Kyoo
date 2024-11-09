import { t } from "elysia";
import { Genre } from "./show";
import { Image } from "./image";
import { ExternalId } from "./external-id";
import { madeInAbyss , registerExamples } from "./examples";
import { comment } from "../utils";

export const SerieStatus = t.UnionEnum([
	"unknown",
	"finished",
	"airing",
	"planned",
]);
export type SerieStatus = typeof SerieStatus.static;

export const Serie = t.Object({
	id: t.String({ format: "uuid" }),
	slug: t.String(),
	name: t.String(),
	description: t.Nullable(t.String()),
	tagline: t.Nullable(t.String()),
	aliases: t.Array(t.String()),
	tags: t.Array(t.String()),

	genres: t.Array(Genre),
	rating: t.Nullable(t.Number({ minimum: 0, maximum: 100 })),
	status: SerieStatus,
	runtime: t.Nullable(
		t.Number({
			minimum: 0,
			description: "Average runtime of all episodes (in minutes.)",
		}),
	),

	startAir: t.Nullable(t.String({ format: "date" })),
	endAir: t.Nullable(t.String({ format: "date" })),
	originalLanguage: t.Nullable(
		t.String({
			description: comment`
				The language code this movie was made in.
				This is a BCP 47 language code (the IETF Best Current Practices on Tags for Identifying Languages).
				BCP 47 is also known as RFC 5646. It subsumes ISO 639 and is backward compatible with it.
			`,
		}),
	),

	poster: t.Nullable(Image),
	thumbnail: t.Nullable(Image),
	banner: t.Nullable(Image),
	logo: t.Nullable(Image),
	trailerUrl: t.Nullable(t.String()),

	createdAt: t.String({ format: "date-time" }),
	nextRefresh: t.String({ format: "date-time" }),

	externalId: ExternalId,
});

export type Serie = typeof Serie.static;

registerExamples(Serie, madeInAbyss);
