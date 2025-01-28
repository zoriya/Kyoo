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
