import { z } from "zod/v4";

const ChapterSkipBehavior = z
	.enum([
		"autoSkip",
		"autoSkipExceptFirstAppearance",
		"showSkipButton",
		"disabled",
	])
	.catch("showSkipButton");

export const User = z
	.object({
		id: z.string(),
		username: z.string(),
		email: z.string(),
		hasPassword: z.boolean().default(true),
		createdDate: z.coerce.date().default(new Date()),
		lastSeen: z.coerce.date().default(new Date()),
		claims: z.object({
			verified: z.boolean().default(true),
			permissions: z.array(z.string()),
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
						.catch("original"),
					audioLanguage: z.string().catch("original"),
					subtitleLanguage: z.string().nullable().catch(null),
					chapterSkip: z
						.object({
							recap: ChapterSkipBehavior,
							intro: ChapterSkipBehavior,
							credits: ChapterSkipBehavior,
							preview: ChapterSkipBehavior,
						})
						.catch({
							recap: "showSkipButton",
							intro: "showSkipButton",
							credits: "showSkipButton",
							preview: "showSkipButton",
						}),
				})
				.default({
					downloadQuality: "original",
					audioLanguage: "default",
					subtitleLanguage: null,
					chapterSkip: {
						recap: "showSkipButton",
						intro: "showSkipButton",
						credits: "showSkipButton",
						preview: "showSkipButton",
					},
				}),
		}),
		oidc: z
			.record(
				z.string(),
				z.object({
					id: z.string(),
					username: z.string(),
					profileUrl: z.string().nullable(),
				}),
			)
			.default({}),
	})
	.transform((x) => ({
		...x,
		logo: `/auth/users/${x.id}/logo`,
		isAdmin: x.claims.permissions.includes("users.write"),
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
