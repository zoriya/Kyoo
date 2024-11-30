import { t } from "elysia";
import { Image } from "../utils/image";

export const BaseEntry = t.Object({
	airDate: t.Nullable(t.String({ format: "data" })),
	runtime: t.Nullable(
		t.Number({ minimum: 0, description: "Runtime of the episode in minutes" }),
	),
	thumbnail: t.Nullable(Image),

	createdAt: t.String({ format: "date-time" }),
	nextRefresh: t.String({ format: "date-time" }),
});

export const EntryTranslation = t.Object({
	name: t.Nullable(t.String()),
	description: t.Nullable(t.String()),
});


// export const SeedEntry = t.Intersect([
// 	Entry,
// 	t.Object({ videos: t.Optional(t.Array(Video)) }),
// ]);
// export type SeedEntry = typeof SeedEntry.static;
//
// export const SeedExtra = t.Intersect([
// 	Extra,
// 	t.Object({ video: t.Optional(Video) }),
// ]);
// export type SeedExtra = typeof SeedExtra.static;
