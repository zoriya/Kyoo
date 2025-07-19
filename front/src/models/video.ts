import { z } from "zod/v4";
import { Entry } from "./entry";
import { Extra } from "./extra";
import { Show } from "./show";
import { zdate } from "./utils/utils";

export const Video = z.object({
	id: z.string(),
	path: z.string(),
	rendering: z.string(),
	part: z.int().min(0).nullable(),
	version: z.int().min(0).default(1),
	guess: z.object({
		title: z.string(),
		kind: z.enum(["episode", "movie", "extra"]).nullable().optional(),
		extraKind: Extra.shape.kind.optional().nullable(),
		years: z.array(z.int()).default([]),
		episodes: z
			.array(
				z.object({
					season: z.int().nullable(),
					episode: z.int(),
				}),
			)
			.default([]),
		externalId: z.record(z.string(), z.string()).default({}),

		// Name of the tool that made the guess
		from: z.string(),
		get history() {
			return z.array(Video.shape.guess.omit({ history: true })).default([]);
		},
	}),
	createdAt: zdate(),
	updatedAt: zdate(),
});

export const FullVideo = Video.extend({
	slugs: z.array(z.string()),
	progress: z.object({
		percent: z.int().min(0).max(100),
		time: z.int().min(0).nullable(),
		playedDate: zdate().nullable(),
		videoId: z.string().nullable(),
	}),
	entries: z.array(Entry),
	previous: z.object({ video: z.string(), entry: Entry }).nullable().optional(),
	next: z.object({ video: z.string(), entry: Entry }).nullable().optional(),
	show: Show.optional(),
});
export type FullVideo = z.infer<typeof FullVideo>;

export const EmbeddedVideo = z.object({
	id: z.string(),
	slug: z.string(),
	path: z.string(),
	rendering: z.string(),
	part: z.number().int().gt(0).nullable(),
	version: z.number().gt(0),
});
export type EmbeddedVideo = z.infer<typeof EmbeddedVideo>;
