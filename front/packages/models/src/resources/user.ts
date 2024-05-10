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

import { z } from "zod";
import { imageFn } from "../traits/images";
import { ResourceP } from "../traits/resource";

export const UserP = ResourceP("user")
	.extend({
		/**
		 * The name of this user.
		 */
		username: z.string(),
		/**
		 * The user email address.
		 */
		email: z.string(),
		/**
		 * The list of permissions of the user. The format of this is implementation dependent.
		 */
		permissions: z.array(z.string()),
		/**
		 * Does the user can sign-in with a password or only via oidc?
		 */
		hasPassword: z.boolean().default(true),
		/**
		 * User settings
		 */
		settings: z
			.object({
				downloadQuality: z
					.union([
						z.literal("original"),
						z.literal("8k"),
						z.literal("4k"),
						z.literal("1440p"),
						z.literal("1080p"),
						z.literal("720p"),
						z.literal("480p"),
						z.literal("360p"),
						z.literal("240p"),
					])
					.default("original")
					.catch("original"),
				audioLanguage: z.string().default("default").catch("default"),
				subtitleLanguage: z.string().nullable().default(null).catch(null),
			})
			// keep a default for older versions of the api
			.default({}),
		/**
		 * User accounts on other services.
		 */
		externalId: z
			.record(
				z.string(),
				z.object({
					id: z.string(),
					username: z.string().nullable().default(""),
					profileUrl: z.string().nullable(),
				}),
			)
			.default({}),
	})
	.transform((x) => ({
		...x,
		logo: imageFn(`/user/${x.slug}/logo`),
		isVerified: x.permissions.length > 0,
		isAdmin: x.permissions?.includes("admin.write"),
	}));

export type User = z.infer<typeof UserP>;
