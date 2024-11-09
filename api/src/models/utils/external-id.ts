import { t } from "elysia";

export const ExternalId = t.Record(
	t.String(),
	t.Object({
		dataId: t.String(),
		link: t.Nullable(t.String({ format: "uri" })),
	}),
);

export type ExternalId = typeof ExternalId.static;
