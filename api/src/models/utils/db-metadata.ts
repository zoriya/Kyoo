import { t } from "elysia";

export const DbMetadata = t.Object({
	createdAt: t.Date(),
	updatedAt: t.Date(),
});
