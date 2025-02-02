import { z } from "zod";

export const Img = z.object({
	source: z.string(),
	blurhash: z.string(),
	low: z.string(),
	medium: z.string(),
	high: z.string(),
});

export const ImagesP = z.object({
	/**
	 * An url to the poster of this resource. If this resource does not have an image, the link will
	 * be null. If the kyoo's instance is not capable of handling this kind of image for the specific
	 * resource, this field won't be present.
	 */
	poster: Img.nullable(),

	/**
	 * An url to the thumbnail of this resource. If this resource does not have an image, the link
	 * will be null. If the kyoo's instance is not capable of handling this kind of image for the
	 * specific resource, this field won't be present.
	 */
	thumbnail: Img.nullable(),

	/**
	 * An url to the logo of this resource. If this resource does not have an image, the link will be
	 * null. If the kyoo's instance is not capable of handling this kind of image for the specific
	 * resource, this field won't be present.
	 */
	logo: Img.nullable(),
});

/**
 * Base traits for items that has image resources.
 */
export type KyooImage = z.infer<typeof Img>;
