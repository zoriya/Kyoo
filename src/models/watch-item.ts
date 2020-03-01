import { Episode } from "./episode";

export interface WatchItem
{
	showTitle: string;
	showSlug: string;
	seasonNumber: number;
	episodeNumber: number;
	title: string;
	link: string;
	duration: number;
	releaseDate;
	isMovie: boolean;

	previousEpisode: string;
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
	link: string;
}
