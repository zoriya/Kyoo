import { t } from "elysia";
import { comment } from "../../utils";

export const ExternalId = t.Record(
	t.String(),
	t.Object({
		dataId: t.String(),
		link: t.Nullable(t.String({ format: "uri" })),
	}),
);
export type ExternalId = typeof ExternalId.static;

export const EpisodeId = t.Record(
	t.String(),
	t.Object({
		serieId: t.String({
			descrpition: comment`
				Id on the external website.
				We store the serie's id because episode id are rarely stable.
			`,
		}),
		season: t.Nullable(
			t.Number({
				description: "Null if the external website uses absolute numbering.",
			}),
		),
		episode: t.Number(),
		link: t.Nullable(t.String({ format: "uri" })),
	}),
);
export type EpisodeId = typeof EpisodeId.static;

export const SeasonId = t.Record(
	t.String(),
	t.Object({
		serieId: t.String({
			descrpition: comment`
				Id on the external website.
				We store the serie's id because episode id are rarely stable.
			`,
		}),
		season: t.Number(),
		link: t.Nullable(t.String({ format: "uri" })),
	}),
);
export type SeasonId = typeof SeasonId.static;
