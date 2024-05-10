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

import { LibraryItem, LibraryItemP, QueryIdentifier, QueryPage } from "@kyoo/models";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createParam } from "solito";
import { DefaultLayout } from "../layout";
import { InfiniteFetch } from "../fetch-infinite";
import { itemMap } from "../browse";
import { SearchSort, SortOrd, Layout } from "../browse/types";
import { BrowseSettings } from "../browse/header";
import { ItemGrid } from "../browse/grid";
import { ItemList } from "../browse/list";
import { usePageStyle } from "@kyoo/primitives";

const { useParam } = createParam<{ sortBy?: string }>();

const query = (
	query?: string,
	sortKey?: SearchSort,
	sortOrd?: SortOrd,
): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	path: ["search", "items"],
	infinite: true,
	params: {
		q: query,
		sortBy:
			sortKey && sortKey !== SearchSort.Relevance ? `${sortKey}:${sortOrd ?? "asc"}` : undefined,
	},
});

export const SearchPage: QueryPage<{ q?: string }> = ({ q }) => {
	const pageStyle = usePageStyle();
	const { t } = useTranslation();
	const [sort, setSort] = useParam("sortBy");
	const sortKey = (sort?.split(":")[0] as SearchSort) || SearchSort.Relevance;
	const sortOrd = (sort?.split(":")[1] as SortOrd) || SortOrd.Asc;
	const [layout, setLayout] = useState(Layout.Grid);

	const LayoutComponent = layout === Layout.Grid ? ItemGrid : ItemList;

	return (
		<InfiniteFetch
			query={query(q, sortKey, sortOrd)}
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
					layout={layout}
					setLayout={setLayout}
				/>
			}
			contentContainerStyle={pageStyle}
		>
			{(item) => <LayoutComponent {...itemMap(item)} />}
		</InfiniteFetch>
	);
};

SearchPage.getLayout = DefaultLayout;
SearchPage.getFetchUrls = ({ q, sortBy }) => [
	query(q, sortBy?.split("-")[0] as SearchSort, sortBy?.split("-")[1] as SortOrd),
];
