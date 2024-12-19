import { t } from "elysia";

export const Image = t.Object({
	id: t.String(),
	source: t.String({ format: "uri" }),
	blurhash: t.String(),
});
export type Image = typeof Image.static;

export const SeedImage = t.String({ format: "uri" });
