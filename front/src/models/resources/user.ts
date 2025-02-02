import { z } from "zod";
import { ResourceP } from "../traits";

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
		logo: `/user/${x.slug}/logo`,
		isVerified: x.permissions.length > 0,
		isAdmin: x.permissions?.includes("admin.write"),
	}));

export type User = z.infer<typeof UserP>;
