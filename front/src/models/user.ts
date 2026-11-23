import { EntityMixin } from "@data-client/rest";
import { z } from "zod/v4";
import { PreferOriginal } from "./utils/images";
import { typed } from "./utils/utils";
import { Quality } from "./video-info";

const ChapterSkipBehavior = z
	.enum([
		"autoSkip",
		"autoSkipExceptFirstAppearance",
		"showSkipButton",
		"disabled",
	])
	.catch("showSkipButton");

const user = z
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
					defaultDownloadQuality: z
						.union([z.literal("ask"), Quality.unwrap()])
						.catch("ask"),
					audioLanguage: z.string().catch("original"),
					showCollectionItems: z.boolean().catch(false),
					preferOriginal: PreferOriginal.catch("non-logo"),
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
					defaultDownloadQuality: "ask",
					audioLanguage: "default",
					showCollectionItems: false,
					preferOriginal: "non-logo",
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

export class User extends EntityMixin(typed<z.infer<typeof user>>(class {}), {
	key: "User",
}) {
	static parser = user.pipe(z.custom<User>());
}

// not an api stuff, used internally
export const Account = user.and(
	z.object({
		apiUrl: z.string(),
		// empty for guests
		token: z.string(),
		selected: z.boolean(),
		guest: z.boolean().optional(),
	}),
);
export type Account = z.infer<typeof Account>;
