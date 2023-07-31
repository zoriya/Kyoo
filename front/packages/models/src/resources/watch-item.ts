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
import { zdate } from "../utils";
import { ImagesP, imageFn } from "../traits";
import { EpisodeP } from "./episode";

/**
 * A audio or subtitle track.
 */
export const TrackP = z.object({
	/**
	 * The index of this track on the episode.
	 */
	index: z.number(),
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
	 */
	isForced: z.boolean(),
});
export type Audio = z.infer<typeof TrackP>;

export const SubtitleP = TrackP.extend({
	/*
	 * The url of this track (only if this is a subtitle)..
	 */
	link: z.string().transform(imageFn),
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

const WatchMovieP = z.preprocess(
	(x: any) => {
		if (!x) return x;

		x.name = x.title;
		return x;
	},
	ImagesP.extend({
		/**
		 * The slug of this episode.
		 */
		slug: z.string(),
		/**
		 * The title of this episode.
		 */
		name: z.string().nullable(),
		/**
		 * The sumarry of this episode.
		 */
		overview: z.string().nullable(),
		/**
		 * The release date of this episode. It can be null if unknown.
		 */
		releaseDate: zdate().nullable(),

		/**
		 * The transcoder's info for this item. This include subtitles, fonts, chapters...
		 */
		info: z.object({
			/**
			 * The sha1 of the video file.
			 */
			sha: z.string(),
			/**
			 * The internal path of the video file.
			 */
			path: z.string(),
			/**
			 * The container of the video file of this episode. Common containers are mp4, mkv, avi and so
			 * on.
			 */
			container: z.string(),
			/**
			 * The list of audio tracks.
			 */
			audios: z.array(TrackP),
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
		}),
		/**
		 * The links to the videos of this watch item.
		 */
		link: z.object({
			direct: z.string().transform(imageFn),
			hls: z.string().transform(imageFn),
		}),
	}),
);

const WatchEpisodeP = WatchMovieP.and(
	z.object({
		/**
		 * The ID of the episode associated with this item.
		 */
		episodeID: z.number(),
		/**
		 * The title of the show containing this episode.
		 */
		showTitle: z.string(),
		/**
		 * The slug of the show containing this episode
		 */
		showSlug: z.string(),
		/**
		 * The season in witch this episode is in.
		 */
		seasonNumber: z.number().nullable(),
		/**
		 * The number of this episode is it's season.
		 */
		episodeNumber: z.number().nullable(),
		/**
		 * The absolute number of this episode. It's an episode number that is not reset to 1 after a
		 * new season.
		 */
		absoluteNumber: z.number().nullable(),
		/**
		 * The episode that come before this one if you follow usual watch orders. If this is the first
		 * episode or this is a movie, it will be null.
		 */
		previousEpisode: EpisodeP.nullable(),
		/**
		 * The episode that come after this one if you follow usual watch orders. If this is the last
		 * aired episode or this is a movie, it will be null.
		 */
		nextEpisode: EpisodeP.nullable(),
	}),
);

export const WatchItemP = z.union([
	WatchMovieP.and(z.object({ isMovie: z.literal(true) })),
	WatchEpisodeP.and(z.object({ isMovie: z.literal(false) })),
]);

/**
 * A watch item for a movie or an episode
 */
export type WatchItem = z.infer<typeof WatchItemP>;
