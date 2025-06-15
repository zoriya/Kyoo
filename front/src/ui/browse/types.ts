import Collection from "@material-symbols/svg-400/rounded/collections_bookmark.svg";
import Movie from "@material-symbols/svg-400/rounded/movie.svg";
import TV from "@material-symbols/svg-400/rounded/tv.svg";
import All from "@material-symbols/svg-400/rounded/view_headline.svg";
import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";

export enum SortBy {
	Name = "name",
	StartAir = "startAir",
	EndAir = "endAir",
	AddedDate = "addedDate",
	Ratings = "rating",
}

export enum SearchSort {
	Relevance = "relevance",
	AirDate = "airDate",
	AddedDate = "addedDate",
	Ratings = "rating",
}

export enum SortOrd {
	Asc = "asc",
	Desc = "desc",
}

export enum Layout {
	Grid,
	List,
}

export enum MediaTypeKey {
	All = "all",
	Movie = "movie",
	Show = "show",
	Collection = "collection",
}

export interface MediaType {
	key: MediaTypeKey;
	icon: ComponentType<SvgProps>;
}

export const MediaTypeAll: MediaType = {
	key: MediaTypeKey.All,
	icon: All,
};

export const MediaTypes: MediaType[] = [
	MediaTypeAll,
	{
		key: MediaTypeKey.Movie,
		icon: Movie,
	},
	{
		key: MediaTypeKey.Show,
		icon: TV,
	},
	{
		key: MediaTypeKey.Collection,
		icon: Collection,
	},
];
