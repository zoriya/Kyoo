import { z } from "zod/v4";

export const Quality = z
	.enum([
		"original",
		"8k",
		"4k",
		"1440p",
		"1080p",
		"720p",
		"480p",
		"360p",
		"240p",
	])
	.default("original");
export type Quality = z.infer<typeof Quality>;

export const VideoTrack = z.object({
	index: z.number(),
	title: z.string().nullable(),
	language: z.string().nullable(),
	codec: z.string(),
	mimeCodec: z.string().nullable(),
	width: z.number(),
	height: z.number(),
	bitrate: z.number(),
	isDefault: z.boolean(),
});

export type VideoTrack = z.infer<typeof VideoTrack>;

export const AudioTrack = z.object({
	index: z.number(),
	title: z.string().nullable(),
	language: z.string().nullable(),
	codec: z.string(),
	mimeCodec: z.string().nullable(),
	bitrate: z.number(),
	isDefault: z.boolean(),
});
export type AudioTrack = z.infer<typeof AudioTrack>;

export const Subtitle = z.object({
	// external subtitles don't have indexes
	index: z.number().nullable(),
	title: z.string().nullable(),
	language: z.string().nullable(),
	codec: z.string(),
	extension: z.string().nullable(),
	isDefault: z.boolean(),
	isForced: z.boolean(),
	isHearingImpaired: z.boolean(),
	isExternal: z.boolean(),
	// only non-null when `isExternal` is true
	path: z.string().nullable(),
	link: z.string().nullable(),
});
export type Subtitle = z.infer<typeof Subtitle>;

export const Chapter = z.object({
	// in seconds
	startTime: z.number(),
	// in seconds
	endTime: z.number(),
	name: z.string(),
	type: z.enum(["content", "recap", "intro", "credits", "preview"]),
});
export type Chapter = z.infer<typeof Chapter>;

export const VideoInfo = z
	.object({
		sha: z.string(),
		path: z.string(),
		extension: z.string(),
		mimeCodec: z.string().nullable(),
		size: z.number(),
		// in seconds
		duration: z.number(),
		container: z.string().nullable(),
		videos: z.array(VideoTrack),
		audios: z.array(AudioTrack),
		subtitles: z.array(Subtitle),
		fonts: z.array(z.string()),
		chapters: z.array(Chapter),
	})
	.transform((x) => {
		const hour = Math.floor(x.duration / 3600);
		const minutes = Math.ceil((x.duration % 3600) / 60);

		return {
			...x,
			duration: `${hour ? `${hour}h` : ""}${minutes}m`,
			durationSeconds: x.duration,
			size: humanFileSize(x.size),
		};
	});
export type VideoInfo = z.infer<typeof VideoInfo>;

// from https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
const humanFileSize = (size: number): string => {
	const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
	return (
		// @ts-expect-error I'm not gonna fix stackoverflow's working code.
		// biome-ignore lint/style/useTemplate: same as above
		(size / 1024 ** i).toFixed(2) * 1 + " " + ["B", "kB", "MB", "GB", "TB"][i]
	);
};
