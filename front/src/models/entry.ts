import { EntityMixin, Union } from "@data-client/rest";
import { z } from "zod/v4";
import { Show } from "./show";
import { KImage } from "./utils/images";
import { typed, zdate } from "./utils/utils";

const base = z.object({
	id: z.string(),
	slug: z.string(),
	order: z.number(),

	name: z.string().nullable(),
	description: z.string().nullable(),
	airDate: zdate().nullable(),
	runtime: z.number().nullable(),
	thumbnail: KImage.nullable(),

	content: z.enum(["story", "recap", "filler", "ova"]),

	createdAt: zdate(),
	updatedAt: zdate(),

	videos: z.array(
		z.object({
			id: z.string(),
			slug: z.string(),
			path: z.string(),
			rendering: z.string(),
			part: z.int().nullable(),
			version: z.int(),
		}),
	),
	progress: z.object({
		percent: z.int().min(0).max(100),
		time: z.int().min(0),
		playedDate: zdate().nullable(),
		videoId: z.string().nullable(),
	}),

	show: z.lazy((): z.ZodType => Show.parser).optional(),
});

const episode = base.extend({
	kind: z.literal("episode"),
	seasonNumber: z.int().gte(0),
	episodeNumber: z.int().gte(0),
	externalId: z.record(
		z.string(),
		z.array(
			z.object({
				serieId: z.string(),
				season: z.int().nullable(),
				episode: z.int(),
				link: z.string().nullable(),
				label: z.string().optional().nullable(),
			}),
		),
	),
});

const movieEntry = base.extend({
	kind: z.literal("movie"),
	tagline: z.string().nullable(),
	poster: KImage.nullable(),
	externalId: z.record(
		z.string(),
		z.array(
			z.union([
				z.object({
					serieId: z.string(),
					season: z.int().nullable(),
					episode: z.int(),
					link: z.string().nullable(),
					label: z.string().optional().nullable(),
				}),
				z.object({
					dataId: z.string(),
					link: z.string().nullable(),
					label: z.string().optional().nullable(),
				}),
			]),
		),
	),
});

const special = base.extend({
	kind: z.literal("special"),
	number: z.int(),
	externalId: z.record(
		z.string(),
		z.array(
			z.object({
				serieId: z.string(),
				season: z.int().nullable(),
				episode: z.int(),
				link: z.string().nullable(),
			}),
		),
	),
});

class Base {
	videos?: z.infer<typeof base>["videos"];
	get href() {
		return this.videos?.length ? `/watch/${this.videos[0]!.slug}` : null;
	}
}

// the lazy `show` can't be typed from zod, the types would loop too
type WithShow = { show?: Show };

export class Episode extends EntityMixin(
	typed<z.infer<typeof episode> & WithShow & Base>(Base),
	{ key: "Episode" },
) {
	static parser = episode.pipe(z.custom<Episode>());
}

export class MovieEntry extends EntityMixin(
	typed<z.infer<typeof movieEntry> & WithShow & Base>(Base),
	{ key: "MovieEntry" },
) {
	static parser = movieEntry.pipe(z.custom<MovieEntry>());
}

export class Special extends EntityMixin(
	typed<z.infer<typeof special> & WithShow & Base>(Base),
	{ key: "Special" },
) {
	static parser = special.pipe(z.custom<Special>());
}

for (const E of [Episode, MovieEntry, Special])
	E.schema = {
		get show() {
			return Show;
		},
	};

export const Entry = Object.assign(
	new Union({ episode: Episode, movie: MovieEntry, special: Special }, "kind"),
	{
		parser: z.discriminatedUnion("kind", [
			Episode.parser,
			MovieEntry.parser,
			Special.parser,
		]),
	},
);
export type Entry = Episode | MovieEntry | Special;
