import { t } from "elysia";

export const DbMetadata = t.Object({
	createdAt: t.String({ format: "date-time" }),
	updatedAt: t.String({ format: "date-time" }),
});
