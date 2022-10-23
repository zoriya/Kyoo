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

export type Item = {
	/**
	 * The slug of this episode.
	 */
	slug: string;
	/**
	 * The title of the show containing this episode.
	 */
	showTitle?: string;
	/**
	 * The slug of the show containing this episode
	 */
	showSlug?: string;
	/**
	 * The season in witch this episode is in.
	 */
	seasonNumber?: number;
	/**
	 * The number of this episode is it's season.
	 */
	episodeNumber?: number;
	/**
	 * The absolute number of this episode. It's an episode number that is not reset to 1 after a
	 * new season.
	 */
	absoluteNumber?: number;
	/**
	 * The title of this episode.
	 */
	name: string;
	/**
	 * The air date of this episode.
	 */
	releaseDate: Date;
	/**
	 * True if this is a movie, false otherwise.
	 */
	isMovie: boolean;
	/**
	 * An url to the poster of this resource. If this resource does not have an image, the link will
	 * be null. If the kyoo's instance is not capable of handling this kind of image for the
	 * specific resource, this field won't be present.
	 */
	poster?: string | null;
	/**
	 * An url to the thumbnail of this resource. If this resource does not have an image, the link
	 * will be null. If the kyoo's instance is not capable of handling this kind of image for the
	 * specific resource, this field won't be present.
	 */
	thumbnail?: string | null;
	/**
	 * An url to the logo of this resource. If this resource does not have an image, the link will
	 * be null. If the kyoo's instance is not capable of handling this kind of image for the
	 * specific resource, this field won't be present.
	 */
	logo?: string | null;
	/**
	 * The links to the videos of this watch item.
	 */
	link: {
		direct: string;
		transmux: string;
	};
};

export const getItem = async (slug: string, apiUrl: string) => {
	try {
		const resp = await fetch(`${apiUrl}/watch/${slug}`);
		if (!resp.ok) {
			console.error(await resp.text());
			return null;
		}
		const ret = (await resp.json()) as Item;
		if (!ret) return null;
		ret.name = (ret as any).title;
		ret.releaseDate = new Date(ret.releaseDate);
		ret.link.direct = `${apiUrl}/${ret.link.direct}`;
		ret.link.transmux = `${apiUrl}/${ret.link.transmux}`;
		ret.thumbnail = `${apiUrl}/${ret.thumbnail}`;
		ret.poster = `${apiUrl}/${ret.poster}`;
		ret.logo = `${apiUrl}/${ret.logo}`;
		return ret;
	} catch (e) {
		console.error("Fetch error", e);
		return null;
	}
};

export const itemToTvMetadata = (item: Item) => {
	const metadata = new cast.framework.messages.TvShowMediaMetadata();
	metadata.title = item.name;
	metadata.season = item.seasonNumber;
	metadata.episode = item.episodeNumber;
	metadata.seriesTitle = item.showTitle;
	metadata.originalAirdate = item.releaseDate.toISOString().substring(0, 10);
	metadata.images = item.poster ? [new cast.framework.messages.Image(item.poster)] : [];
	return metadata;
}

export const itemToMovie = (item: Item) => {
	const metadata = new cast.framework.messages.MovieMediaMetadata();
	metadata.title = item.name;
	metadata.releaseDate = item.releaseDate.toISOString().substring(0, 10);
	metadata.images = item.poster ? [new cast.framework.messages.Image(item.poster)] : [];
	return metadata;
}

