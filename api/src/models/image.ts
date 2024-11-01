import { t } from "elysia";

export const Image = t.Object({
	source: t.String({ format: "uri" }),
	blurhash: t.String(),
	low: t.String({ format: "uri" }),
	medium: t.String({ format: "uri" }),
	high: t.String({ format: "uri" }),
});
export type Image = typeof Image.static;
