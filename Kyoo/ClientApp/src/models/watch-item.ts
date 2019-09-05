export interface WatchItem
{
  showTitle: string;
  showSlug: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  releaseDate;
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
