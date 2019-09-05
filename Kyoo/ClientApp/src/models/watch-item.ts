import { Episode } from "./episode";

export interface WatchItem
{
  showTitle: string;
  showSlug: string;
  seasonNumber: number;
  episodeNumber: number;
  video: string;
  title: string;
  link: string;
  releaseDate;

  previousEpisode: string;
  nextEpisode: Episode;

  audio: Stream[];
  subtitles: Stream[];
}

export interface Stream
{
  title: string;
  language: string;
  isDefault: boolean;
  isForced: boolean;
  format: string;
}
