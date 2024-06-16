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

import { type LibraryItem, LibraryItemP, type QueryIdentifier, type QueryPage } from "@kyoo/models";
import { usePageStyle } from "@kyoo/primitives";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createParam } from "solito";
import { createFilterString, getMediaTypeFromParam, itemMap } from "../browse";
import { ItemGrid } from "../browse/grid";
import { BrowseSettings } from "../browse/header";
import { ItemList } from "../browse/list";
import { Layout, type MediaType, MediaTypes, SearchSort, SortOrd } from "../browse/types";
import { InfiniteFetch } from "../fetch-infinite";
import { DefaultLayout } from "../layout";

const { useParam } = createParam<{ sortBy?: string; mediaType?: string }>();

const query = (
	mediaType: MediaType,
	query?: string,
	sortKey?: SearchSort,
	sortOrd?: SortOrd,
): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	path: ["search", "items"],
	infinite: true,
	params: {
		q: query,
		filter: createFilterString(mediaType),
		sortBy:
			sortKey && sortKey !== SearchSort.Relevance ? `${sortKey}:${sortOrd ?? "asc"}` : undefined,
	},
});

export const SearchPage: QueryPage<{ q?: string }> = ({ q }) => {
	const pageStyle = usePageStyle();
	const { t } = useTranslation();
	const [sort, setSort] = useParam("sortBy");
	const [mediaTypeParam, setMediaTypeParam] = useParam("mediaType");
	const sortKey = (sort?.split(":")[0] as SearchSort) || SearchSort.Relevance;
	const sortOrd = (sort?.split(":")[1] as SortOrd) || SortOrd.Asc;
	const [layout, setLayout] = useState(Layout.Grid);

	const mediaType = getMediaTypeFromParam(mediaTypeParam);
	const LayoutComponent = layout === Layout.Grid ? ItemGrid : ItemList;

	return (
		<InfiniteFetch
			query={query(mediaType, q, sortKey, sortOrd)}
			layout={LayoutComponent.layout}
			empty={t("search.empty")}
			incremental
			Header={
				<BrowseSettings
					availableSorts={Object.values(SearchSort)}
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
			contentContainerStyle={pageStyle}
			Render={({ item }) => <LayoutComponent {...itemMap(item)} />}
			Loader={LayoutComponent.Loader}
		/>
	);
};

SearchPage.getLayout = DefaultLayout;
SearchPage.getFetchUrls = ({ q, sortBy, mediaType }) => {
	const mediaTypeObj = getMediaTypeFromParam(mediaType);
	return [
		query(mediaTypeObj, q, sortBy?.split("-")[0] as SearchSort, sortBy?.split("-")[1] as SortOrd),
	];
};
