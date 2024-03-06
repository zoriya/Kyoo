/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import { Platform } from "react-native";
import { ZodObject, ZodRawShape, z } from "zod";
import { lastUsedUrl } from "..";

export const imageFn = (url: string) =>
	Platform.OS === "web" ? `/api${url}` : `${lastUsedUrl}${url}`;

export const baseAppUrl = () => (Platform.OS === "web" ? window.location.origin : "kyoo://");

export const Img = z.object({
	source: z.string(),
	blurhash: z.string(),
});

const ImagesP = z.object({
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

const addQualities = (x: object | null | undefined, href: string) => {
	if (x === null) return null;
	return {
		...x,
		low: imageFn(`${href}?quality=low`),
		medium: imageFn(`${href}?quality=medium`),
		high: imageFn(`${href}?quality=high`),
	};
};

export const withImages = <T extends ZodRawShape>(parser: ZodObject<T>) => {
	return parser.merge(ImagesP).transform((x) => {
		return {
			...x,
			poster: addQualities(x.poster, `/${x.kind}/${x.slug}/poster`),
			thumbnail: addQualities(x.thumbnail, `/${x.kind}/${x.slug}/thumbnail`),
			logo: addQualities(x.logo, `/${x.kind}/${x.slug}/logo`),
		};
	});
};

/**
 * Base traits for items that has image resources.
 */
export type KyooImage = z.infer<typeof Img> & { low: string; medium: string; high: string };
