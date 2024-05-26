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
import { imageFn } from "..";

export const OidcInfoP = z.object({
	/*
	 * The name of this oidc service. Human readable.
	 */
	displayName: z.string(),
	/*
	 * A url returing a square logo for this provider.
	 */
	logoUrl: z.string().nullable(),
});

export enum SetupStep {
	MissingAdminAccount = "MissingAdminAccount",
	NoVideoFound = "NoVideoFound",
	Done = "Done",
}

export const ServerInfoP = z
	.object({
		/*
		 * True if guest accounts are allowed on this instance.
		 */
		allowGuests: z.boolean(),
		/*
		 * The list of permissions available for the guest account.
		 */
		guestPermissions: z.array(z.string()),
		/*
		 * The url to reach the homepage of kyoo (add /api for the api).
		 */
		publicUrl: z.string(),
		/*
		 * The list of oidc providers configured for this instance of kyoo.
		 */
		oidc: z.record(z.string(), OidcInfoP),
		/*
		 * Check if kyoo's setup is finished.
		 */
		setupStatus: z.nativeEnum(SetupStep),
	})
	.transform((x) => {
		const baseUrl = Platform.OS === "web" ? x.publicUrl : "kyoo://";
		return {
			...x,
			oidc: Object.fromEntries(
				Object.entries(x.oidc).map(([provider, info]) => [
					provider,
					{
						...info,
						link: imageFn(`/auth/login/${provider}?redirectUrl=${baseUrl}/login/callback`),
					},
				]),
			),
		};
	});

/**
 * A season of a Show.
 */
export type ServerInfo = z.infer<typeof ServerInfoP>;
