import { z } from "zod/v4";

export const User = z
	.object({
		id: z.string(),
		username: z.string(),
		email: z.string(),
		// permissions: z.array(z.string()),
		// hasPassword: z.boolean().default(true),
		// settings: z
		// 	.object({
		// 		downloadQuality: z
		// 			.union([
		// 				z.literal("original"),
		// 				z.literal("8k"),
		// 				z.literal("4k"),
		// 				z.literal("1440p"),
		// 				z.literal("1080p"),
		// 				z.literal("720p"),
		// 				z.literal("480p"),
		// 				z.literal("360p"),
		// 				z.literal("240p"),
		// 			])
		// 			.default("original")
		// 			.catch("original"),
		// 		audioLanguage: z.string().default("default").catch("default"),
		// 		subtitleLanguage: z.string().nullable().default(null).catch(null),
		// 	})
		// 	// keep a default for older versions of the api
		// 	.default({}),
		// externalId: z
		// 	.record(
		// 		z.string(),
		// 		z.object({
		// 			id: z.string(),
		// 			username: z.string().nullable().default(""),
		// 			profileUrl: z.string().nullable(),
		// 		}),
		// 	)
		// 	.default({}),
	})
	.transform((x) => ({
		...x,
		logo: `auth/users/${x.id}/logo`,
		// isVerified: x.permissions.length > 0,
		isAdmin: true, //x.permissions?.includes("admin.write"),
	}));
export type User = z.infer<typeof User>;

// not an api stuff, used internally
export const Account = User.and(
	z.object({
		apiUrl: z.string(),
		token: z.string(),
		selected: z.boolean(),
	}),
);
export type Account = z.infer<typeof Account>;
