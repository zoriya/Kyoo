import type { ObjectOptions } from "@sinclair/typebox";
import { t, type TSchema } from "elysia";

export const Page = <T extends TSchema>(schema: T, options?: ObjectOptions) =>
	t.Object(
		{
			items: t.Array(schema),
			this: t.String({ format: "uri" }),
			prev: t.String({ format: "uri" }),
			next: t.String({ format: "uri" }),
		},
		options,
	);
