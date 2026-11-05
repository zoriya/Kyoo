import { EntityMixin } from "@data-client/rest";
import { z } from "zod/v4";
import { Entry } from "./entry";
import { Extra } from "./extra";
import { Show } from "./show";
import { typed, zdate } from "./utils/utils";

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

const video = z.object({
	id: z.string(),
	path: z.string(),
	rendering: z.string(),
	part: z.int().min(0).nullable(),
	version: z.int().min(0).default(1),
	guess: Guess.extend({ history: z.array(Guess).default([]) }),
	createdAt: zdate(),
	updatedAt: zdate(),

	// only sent by `/videos/:id`
	entries: z.array(Entry.parser).optional(),
	progress: z
		.object({
			percent: z.int().min(0).max(100),
			time: z.int().min(0),
			playedDate: zdate().nullable(),
			videoId: z.string().nullable(),
		})
		.optional(),
	previous: z
		.object({
			video: z.string().nullable(),
			entry: Entry.parser,
		})
		.nullable()
		.optional(),
	next: z
		.object({
			video: z.string().nullable(),
			entry: Entry.parser,
		})
		.nullable()
		.optional(),
	show: Show.parser.optional().nullable(),
});

export class Video extends EntityMixin(typed<z.infer<typeof video>>(class {}), {
	key: "Video",
	schema: {
		entries: [Entry],
		previous: { entry: Entry },
		next: { entry: Entry },
		show: Show,
	},
}) {
	static parser = video.pipe(z.custom<Video>());
}

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
