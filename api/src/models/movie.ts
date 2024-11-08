import { t } from "elysia";
import { Genre, ShowStatus } from "./show";
import { Image } from "./image";
import { ExternalId } from "./external-id";

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
	status: ShowStatus,
	runtime: t.Nullable(t.Number({ minimum: 0 })),

	airDate: t.Nullable(t.String({ format: "date" })),
	originalLanguage: t.Nullable(t.String()),

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

// Movie.examples = [{
// 	slug: "bubble",
// 	title: "Bubble",
// 	tagline: "Is she a calamity or a blessing?",
// 	description: " In an abandoned Tokyo overrun by bubbles and gravitational abnormalities, one gifted young man has a fateful meeting with a mysterious girl. ",
// }]
