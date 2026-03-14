import { z } from "zod/v4";
import { Entry, Episode, MovieEntry, Special } from "./entry";
import { Extra } from "./extra";
import { Show } from "./show";
import { zdate } from "./utils/utils";

export const Guess = z.looseObject({
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
});

export const Video = z.object({
	id: z.string(),
	path: z.string(),
	rendering: z.string(),
	part: z.int().min(0).nullable(),
	version: z.int().min(0).default(1),
	guess: Guess.extend({ history: z.array(Guess).default([]) }),
	createdAt: zdate(),
	updatedAt: zdate(),
});

export const FullVideo = Video.extend({
	entries: z.array(
		z.discriminatedUnion("kind", [
			Episode.omit({ progress: true, videos: true }),
			MovieEntry.omit({ progress: true, videos: true }),
			Special.omit({ progress: true, videos: true }),
		]),
	),
	progress: z.object({
		percent: z.int().min(0).max(100),
		time: z.int().min(0),
		playedDate: zdate().nullable(),
		videoId: z.string().nullable(),
	}),
	previous: z.object({ video: z.string(), entry: Entry }).nullable().optional(),
	next: z.object({ video: z.string(), entry: Entry }).nullable().optional(),
	show: Show.optional().nullable(),
});
export type FullVideo = z.infer<typeof FullVideo>;

export const ScanRequest = z.object({
	id: z.string(),
	kind: z.enum(["episode", "movie"]),
	title: z.string(),
	year: z.int().nullable(),
	status: z.enum(["pending", "running", "failed"]),
	error: z
		.object({
			title: z.string(),
			message: z.string(),
			traceback: z.array(z.string()).default([]),
		})
		.nullable(),
	startedAt: zdate().nullable(),
	videos: z.array(z.string()).default([]),
});
export type ScanRequest = z.infer<typeof ScanRequest>;
