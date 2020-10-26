import { Episode } from "./resources/episode";

export interface WatchItem
{
	showTitle: string;
	showSlug: string;
	seasonNumber: number;
	episodeNumber: number;
	title: string;
	slug: string;
	duration: number;
	releaseDate;
	isMovie: boolean;

	previousEpisode: Episode;
	nextEpisode: Episode;

	container: string;
	video: Track;
	audios: Track[];
	subtitles: Track[];
}

export interface Track
{
	displayName: string;
	title: string;
	language: string;
	isDefault: boolean;
	isForced: boolean;
	codec: string;
	slug: string;
}
