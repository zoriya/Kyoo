/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import { z } from "zod";
import { imageFn } from "../traits";
import { QualityP } from "./quality";

/**
 * A audio or subtitle track.
 */
export const TrackP = z.object({
	/**
	 * The index of this track on the episode.
	 * NOTE: external subtitles can have a null index
	 */
	index: z.number().nullable(),
	/**
	 * The title of the stream.
	 */
	title: z.string().nullable(),
	/**
	 * The language of this stream (as a ISO-639-2 language code)
	 */
	language: z.string().nullable(),
	/**
	 * The codec of this stream.
	 */
	codec: z.string(),
	/**
	 * Is this stream the default one of it's type?
	 */
	isDefault: z.boolean(),
	/**
	 * Is this stream tagged as forced?
	 * NOTE: not available for videos
	 */
	isForced: z.boolean().optional(),
});
export type Track = z.infer<typeof TrackP>;

/**
 * A Video track
 */
export const VideoP = TrackP.extend({
	/**
	 * The Quality of the Video
	 * E.g. "1080p"
	 */
	quality: QualityP,
	/**
	 * The Width of the Video Frame
	 * E.g. 1424
	 */
	width: z.number(),
	/**
	 * The Height of the Video Frame
	 * E.g. 1072
	 */
	height: z.number(),
	/**
	 * The Bitrate (in bits/seconds) of the video track
	 * E.g. 2693245
	 */
	bitrate: z.number(),
});

export type Video = z.infer<typeof VideoP>;

export const AudioP = TrackP;
export type Audio = z.infer<typeof AudioP>;

export const SubtitleP = TrackP.extend({
	/*
	 * The url of this track (only if this is a subtitle)..
	 */
	link: z.string().transform(imageFn).nullable(),
	/*
	 * Is this an external subtitle (as in stored in a different file)
	 */
	isExternal: z.boolean(),
	/**
	 * Is this a hearing impaired subtitle?
	 */
	isHearingImpaired: z.boolean(),
});
export type Subtitle = z.infer<typeof SubtitleP>;

export const ChapterP = z.object({
	/**
	 * The start time of the chapter (in second from the start of the episode).
	 */
	startTime: z.number(),
	/**
	 * The end time of the chapter (in second from the start of the episode).
	 */
	endTime: z.number(),
	/**
	 * The name of this chapter. This should be a human-readable name that could be presented to the
	 * user. There should be well-known chapters name for commonly used chapters. For example, use
	 * "Opening" for the introduction-song and "Credits" for the end chapter with credits.
	 */
	name: z.string(),
});
export type Chapter = z.infer<typeof ChapterP>;

/**
 * The transcoder's info for this item. This include subtitles, fonts, chapters...
 */
export const WatchInfoP = z
	.object({
		/**
		 * The sha1 of the video file.
		 */
		sha: z.string(),
		/**
		 * The internal path of the video file.
		 */
		path: z.string(),
		/**
		 * The extension used to store this video file.
		 */
		extension: z.string(),
		/**
		 * The whole mimetype (defined as the RFC 6381).
		 * ex: `video/mp4; codecs="avc1.640028, mp4a.40.2"`
		 */
		mimeCodec: z.string(),
		/**
		 * The file size of the video file.
		 */
		size: z.number(),
		/**
		 * The duration of the video (in seconds).
		 */
		duration: z.number(),
		/**
		 * The container of the video file of this episode. Common containers are mp4, mkv, avi and so on.
		 */
		container: z.string().nullable(),
		/**
		 * The video track.
		 */
		videos: z.array(VideoP),
		/**
		 * The list of audio tracks.
		 */
		audios: z.array(AudioP),
		/**
		 * The list of subtitles tracks.
		 */
		subtitles: z.array(SubtitleP),
		/**
		 * The list of fonts that can be used to display subtitles.
		 */
		fonts: z.array(z.string().transform(imageFn)),
		/**
		 * The list of chapters. See Chapter for more information.
		 */
		chapters: z.array(ChapterP),
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

// from https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
const humanFileSize = (size: number): string => {
	const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
	// @ts-ignore I'm not gonna fix stackoverflow's working code.
	// biome-ignore lint: same as above
	return (size / Math.pow(1024, i)).toFixed(2) * 1 + " " + ["B", "kB", "MB", "GB", "TB"][i];
};

/**
 * A watch info for a video
 */
export type WatchInfo = z.infer<typeof WatchInfoP>;
