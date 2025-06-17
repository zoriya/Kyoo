import { type ComponentProps, useState } from "react";
import {
	type LibraryItem,
	LibraryItemP,
	type QueryIdentifier,
	type QueryPage,
	getDisplayDate,
} from "~/models";
import { useQueryState } from "~/utils";
import { DefaultLayout } from "../../../packages/ui/src/layout";
import { InfiniteFetch } from "../../query/fetch-infinite";
import { ItemGrid } from "~/components";
import { BrowseSettings } from "./header";
import { ItemList } from "../../components/item-list";
import {
	Layout,
	type MediaType,
	MediaTypeAll,
	MediaTypeKey,
	MediaTypes,
	SortBy,
	SortOrd,
} from "./types";

export const itemMap = (
	item: LibraryItem,
): ComponentProps<typeof ItemGrid> & ComponentProps<typeof ItemList> => ({
	slug: item.slug,
	name: item.name,
	subtitle: item.kind !== "collection" ? getDisplayDate(item) : null,
	href: item.href,
	poster: item.poster,
	thumbnail: item.thumbnail,
	watchStatus: item.kind !== "collection" ? (item.watchStatus?.status ?? null) : null,
	type: item.kind,
	watchPercent: item.kind !== "collection" ? (item.watchStatus?.watchedPercent ?? null) : null,
	unseenEpisodesCount:
		item.kind === "show" ? (item.watchStatus?.unseenEpisodesCount ?? item.episodesCount!) : null,
});

export const createFilterString = (mediaType: MediaType): string | undefined => {
	return mediaType !== MediaTypeAll ? `kind eq ${mediaType.key}` : undefined;
};

const query = (
	mediaType: MediaType,
	sortKey?: SortBy,
	sortOrd?: SortOrd,
): QueryIdentifier<LibraryItem> => {
	return {
		parser: LibraryItemP,
		path: ["items"],
		infinite: true,
		params: {
			sortBy: sortKey ? `${sortKey}:${sortOrd ?? "asc"}` : "name:asc",
			filter: createFilterString(mediaType),
			fields: ["watchStatus", "episodesCount"],
		},
	};
};

export const getMediaTypeFromParam = (mediaTypeParam?: string): MediaType => {
	const mediaTypeKey = (mediaTypeParam as MediaTypeKey) || MediaTypeKey.All;
	return MediaTypes.find((t) => t.key === mediaTypeKey) ?? MediaTypeAll;
};

export const BrowsePage: QueryPage = () => {
	const [sort, setSort] = useQueryState("sortBy", "");
	const [mediaTypeParam, setMediaTypeParam] = useQueryState("mediaType", "");
	const sortKey = (sort?.split(":")[0] as SortBy) || SortBy.Name;
	const sortOrd = (sort?.split(":")[1] as SortOrd) || SortOrd.Asc;
	const [layout, setLayout] = useState(Layout.Grid);

	const mediaType = getMediaTypeFromParam(mediaTypeParam);
	const LayoutComponent = layout === Layout.Grid ? ItemGrid : ItemList;

	return (
		<InfiniteFetch
			query={query(mediaType, sortKey, sortOrd)}
			layout={LayoutComponent.layout}
			Header={
				<BrowseSettings
					availableSorts={Object.values(SortBy)}
					sortKey={sortKey}
					sortOrd={sortOrd}
					setSort={(key, ord) => {
						setSort(`${key}:${ord}`);
					}}
					mediaType={mediaType}
					availableMediaTypes={MediaTypes}
					setMediaType={(mediaType) => {
						setMediaTypeParam(mediaType.key);
					}}
					layout={layout}
					setLayout={setLayout}
				/>
			}
			Render={({ item }) => <LayoutComponent {...itemMap(item)} />}
			Loader={LayoutComponent.Loader}
		/>
	);
};

BrowsePage.getLayout = DefaultLayout;

BrowsePage.getFetchUrls = ({ mediaType, sortBy }) => {
	const mediaTypeObj = getMediaTypeFromParam(mediaType);
	return [query(mediaTypeObj, sortBy?.split("-")[0] as SortBy, sortBy?.split("-")[1] as SortOrd)];
};
