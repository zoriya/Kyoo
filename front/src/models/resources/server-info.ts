import { Platform } from "react-native";
import { z } from "zod";

export const OidcInfoP = z.object({
	/*
	 * The name of this oidc service. Human readable.
	 */
	displayName: z.string(),
	/*
	 * A url returning a square logo for this provider.
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
		/*
		 * True if password login is enabled on this instance.
		 */
		passwordLoginEnabled: z.boolean(),
		/*
		 * True if registration is enabled on this instance.
		 */
		registrationEnabled: z.boolean(),
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
						link: `/auth/login/${provider}?redirectUrl=${baseUrl}/login/callback`,
					},
				]),
			),
		};
	});

/**
 * A season of a Show.
 */
export type ServerInfo = z.infer<typeof ServerInfoP>;
