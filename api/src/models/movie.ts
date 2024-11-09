import { t } from "elysia";
import { Genre } from "./utils/genres";
import { Image } from "./utils/image";
import { ExternalId } from "./utils/external-id";
import { bubble, registerExamples } from "./examples";
import { comment } from "../utils";

export const MovieStatus = t.UnionEnum(["unknown", "finished", "planned"]);
export type MovieStatus = typeof MovieStatus.static;

export const Movie = t.Object({
	id: t.String({ format: "uuid" }),
	slug: t.String(),
	name: t.String(),
	description: t.Nullable(t.String()),
	tagline: t.Nullable(t.String()),
	aliases: t.Array(t.String()),
	tags: t.Array(t.String()),

	genres: t.Array(Genre),
	rating: t.Nullable(t.Number({ minimum: 0, maximum: 100 })),
	status: MovieStatus,
	runtime: t.Nullable(
		t.Number({ minimum: 0, description: "Runtime of the movie in minutes." }),
	),

	airDate: t.Nullable(t.String({ format: "date" })),
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

export type Movie = typeof Movie.static;

registerExamples(Movie, bubble.movie);
