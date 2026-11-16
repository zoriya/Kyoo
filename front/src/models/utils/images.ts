import { z } from "zod/v4";

export const KImage = z
	.object({
		id: z.string(),
		source: z.string(),
		blurhash: z.string(),
	})
	.transform((x) => ({
		...x,
		low: `/api/images/${x.id}?quality=low`,
		medium: `/api/images/${x.id}?quality=medium`,
		high: `/api/images/${x.id}?quality=high`,
	}));

export type KImage = z.infer<typeof KImage>;

type Images = {
	poster: KImage | null;
	thumbnail: KImage | null;
	banner: KImage | null;
	logo: KImage | null;
};

export const PreferOriginal = z.enum(["always", "non-logo", "never"]);
export type PreferOriginal = z.infer<typeof PreferOriginal>;

export const showImages = (
	show: Images & { original: Images },
	preferOriginal: PreferOriginal,
): Images =>
	preferOriginal !== "never"
		? {
				poster: show.original.poster ?? show.poster,
				thumbnail: show.original.thumbnail ?? show.thumbnail,
				banner: show.original.banner ?? show.banner,
				logo:
					preferOriginal === "always"
						? (show.original.logo ?? show.logo)
						: show.logo,
			}
		: show;
