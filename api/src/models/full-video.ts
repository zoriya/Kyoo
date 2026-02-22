import { t } from "elysia";
import { Entry } from "./entry";
import { Progress } from "./history";
import { Movie } from "./movie";
import { Serie } from "./serie";
import { Video } from "./video";

export const FullVideo = t.Composite([
	Video,
	t.Object({
		progress: t.Optional(Progress),
		entries: t.Array(t.Omit(Entry, ["videos", "progress"])),
		previous: t.Optional(
			t.Nullable(
				t.Object({
					video: t.String({
						format: "slug",
						examples: ["made-in-abyss-s1e12"],
					}),
					entry: Entry,
				}),
			),
		),
		next: t.Optional(
			t.Nullable(
				t.Object({
					video: t.String({
						format: "slug",
						examples: ["made-in-abyss-dawn-of-the-deep-soul"],
					}),
					entry: Entry,
				}),
			),
		),
		show: t.Optional(
			t.Union([
				t.Composite([t.Object({ kind: t.Literal("movie") }), Movie]),
				t.Composite([t.Object({ kind: t.Literal("serie") }), Serie]),
			]),
		),
	}),
]);
export type FullVideo = typeof FullVideo.static;
