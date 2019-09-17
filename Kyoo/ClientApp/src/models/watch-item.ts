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
  duration: number;
  releaseDate;

  previousEpisode: string;
  nextEpisode: Episode;

  audio: Track[];
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
