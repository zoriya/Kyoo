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
import { z } from "zod";

export const imageFn = (url: string) =>
	Platform.OS === "web" ? `/api/${url}` : process.env.PUBLIC_BACK_URL + url;

export const ImagesP = z.object({
	/**
	 * An url to the poster of this resource. If this resource does not have an image, the link will
	 * be null. If the kyoo's instance is not capable of handling this kind of image for the specific
	 * resource, this field won't be present.
	 */
	poster: z.string().transform(imageFn).optional().nullable(),

	/**
	 * An url to the thumbnail of this resource. If this resource does not have an image, the link
	 * will be null. If the kyoo's instance is not capable of handling this kind of image for the
	 * specific resource, this field won't be present.
	 */
	thumbnail: z.string().transform(imageFn).optional().nullable(),

	/**
	 * An url to the logo of this resource. If this resource does not have an image, the link will be
	 * null. If the kyoo's instance is not capable of handling this kind of image for the specific
	 * resource, this field won't be present.
	 */
	logo: z.string().transform(imageFn).optional().nullable(),

	/**
	 * An url to the thumbnail of this resource. If this resource does not have an image, the link
	 * will be null. If the kyoo's instance is not capable of handling this kind of image for the
	 * specific resource, this field won't be present.
	 */
	trailer: z.string().transform(imageFn).optional().nullable(),
});

/**
 * Base traits for items that has image resources.
 */
export type Images = z.infer<typeof ImagesP>;
