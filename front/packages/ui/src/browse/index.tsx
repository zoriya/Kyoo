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

import { ComponentProps, useState } from "react";
import {
	QueryIdentifier,
	QueryPage,
	LibraryItem,
	LibraryItemP,
	ItemType,
	getDisplayDate,
} from "@kyoo/models";
import { DefaultLayout } from "../layout";
import { WithLoading } from "../fetch";
import { InfiniteFetch } from "../fetch-infinite";
import { ItemGrid } from "./grid";
import { ItemList } from "./list";
import { SortBy, SortOrd, Layout } from "./types";

export const itemMap = (
	item: WithLoading<LibraryItem>,
): WithLoading<ComponentProps<typeof ItemGrid> & ComponentProps<typeof ItemList>> => {
	if (item.isLoading) return item;

	let href;
	if (item?.type === ItemType.Movie) href = `/movie/${item.slug}`;
	else if (item?.type === ItemType.Show) href = `/show/${item.slug}`;
	else href = `/collection/${item.slug}`;

	return {
		isLoading: item.isLoading,
		name: item.name,
		subtitle: item.type !== ItemType.Collection ? getDisplayDate(item) : undefined,
		href,
		poster: item.poster,
		thumbnail: item.thumbnail,
	};
};

const query = (
	slug?: string,
	sortKey?: SortBy,
	sortOrd?: SortOrd,
): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	path: slug ? ["library", slug, "items"] : ["items"],
	infinite: true,
	params: {
		// The API still uses title isntead of name
		sortBy: sortKey
			? `${sortKey === SortBy.Name ? "title" : sortKey}:${sortOrd ?? "asc"}`
			: "title:asc",
	},
});

export const BrowsePage: QueryPage<{ slug?: string }> = ({ slug }) => {
	const [sortKey, setSort] = useState(SortBy.Name);
	const [sortOrd, setSortOrd] = useState(SortOrd.Asc);
	const [layout, setLayout] = useState(Layout.Grid);

	const LayoutComponent = layout === Layout.Grid ? ItemGrid : ItemList;

	// TODO list header to seet sort things, filter and layout.
	return (
		<>
			{/* <BrowseSettings */}
			{/* 	sortKey={sortKey} */}
			{/* 	setSort={setSort} */}
			{/* 	sortOrd={sortOrd} */}
			{/* 	setSortOrd={setSortOrd} */}
			{/* 	layout={layout} */}
			{/* 	setLayout={setLayout} */}
			{/* /> */}
			<InfiniteFetch
				query={query(slug, sortKey, sortOrd)}
				placeholderCount={15}
				layout={LayoutComponent.layout}
			>
				{(item) => <LayoutComponent {...itemMap(item)} />}
			</InfiniteFetch>
		</>
	);
};

BrowsePage.getLayout = DefaultLayout;

BrowsePage.getFetchUrls = ({ slug, sortBy }) => [
	query(slug, sortBy?.split("-")[0] as SortBy, sortBy?.split("-")[1] as SortOrd),
];
