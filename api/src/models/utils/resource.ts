import { FormatRegistry } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { t } from "elysia";

export const slugPattern = "^[a-z0-9-]+$";

FormatRegistry.Set("slug", (slug) => {
	return /^[a-z0-9-]+$/g.test(slug);
});

export const Resource = t.Object({
	id: t.String({ format: "uuid" }),
	slug: t.String({ format: "slug" }),
});

const checker = TypeCompiler.Compile(t.String({ format: "uuid" }));
export const isUuid = (id: string) => checker.Check(id);
