import { t } from "elysia";

export const Video = t.Object({
	id: t.String({ format: "uuid" }),
	path: t.String(),
	rendering: t.Number({ minimum: 0 }),
	part: t.Number({ minimum: 0 }),
	version: t.Number({ minimum: 0 }),

	createdAt: t.String({ format: "date-time" }),
});

export type Video = typeof Video.static;
