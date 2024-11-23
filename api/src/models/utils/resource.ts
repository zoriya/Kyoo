import { FormatRegistry } from "@sinclair/typebox";
import { t } from "elysia";

export const slugPattern = "^[a-z0-9-]+$";

FormatRegistry.Set("slug", (slug) => {
	return /^[a-z0-9-]+$/g.test(slug);
});

export const Resource = t.Object({
	id: t.String({ format: "uuid" }),
	slug: t.String({ format: "slug" }),
});
