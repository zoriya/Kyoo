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

import {
	type QueryIdentifier,
	type QueryPage,
	type LibraryItem,
	LibraryItemP,
	getDisplayDate,
} from "@kyoo/models";
import { type ComponentProps, useState } from "react";
import { createParam } from "solito";
import { DefaultLayout } from "../layout";
import type { WithLoading } from "../fetch";
import { InfiniteFetch } from "../fetch-infinite";
import { ItemGrid } from "./grid";
import { ItemList } from "./list";
import { SortBy, SortOrd, Layout } from "./types";
import { BrowseSettings } from "./header";

const { useParam } = createParam<{ sortBy?: string }>();

export const itemMap = (
	item: WithLoading<LibraryItem>,
): WithLoading<ComponentProps<typeof ItemGrid> & ComponentProps<typeof ItemList>> => {
	if (item.isLoading) return item as any;

	return {
		isLoading: item.isLoading,
		slug: item.slug,
		name: item.name,
		subtitle: item.kind !== "collection" ? getDisplayDate(item) : undefined,
		href: item.href,
		poster: item.poster,
		thumbnail: item.thumbnail,
		watchStatus: item.kind !== "collection" ? item.watchStatus?.status ?? null : null,
		type: item.kind,
		watchPercent: item.kind !== "collection" ? item.watchStatus?.watchedPercent ?? null : null,
		unseenEpisodesCount:
			item.kind === "show" ? item.watchStatus?.unseenEpisodesCount ?? item.episodesCount! : null,
	};
};

const query = (sortKey?: SortBy, sortOrd?: SortOrd): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	path: ["items"],
	infinite: true,
	params: {
		sortBy: sortKey ? `${sortKey}:${sortOrd ?? "asc"}` : "name:asc",
		fields: ["watchStatus", "episodesCount"],
	},
});

export const BrowsePage: QueryPage = () => {
	const [sort, setSort] = useParam("sortBy");
	const sortKey = (sort?.split(":")[0] as SortBy) || SortBy.Name;
	const sortOrd = (sort?.split(":")[1] as SortOrd) || SortOrd.Asc;
	const [layout, setLayout] = useState(Layout.Grid);

	const LayoutComponent = layout === Layout.Grid ? ItemGrid : ItemList;

	return (
		<InfiniteFetch
			query={query(sortKey, sortOrd)}
			layout={LayoutComponent.layout}
			Header={
				<BrowseSettings
					availableSorts={Object.values(SortBy)}
					sortKey={sortKey}
					sortOrd={sortOrd}
					setSort={(key, ord) => {
						setSort(`${key}:${ord}`);
					}}
					layout={layout}
					setLayout={setLayout}
				/>
			}
		>
			{(item) => <LayoutComponent {...itemMap(item)} />}
		</InfiniteFetch>
	);
};

BrowsePage.getLayout = DefaultLayout;

BrowsePage.getFetchUrls = ({ sortBy }) => [
	query(sortBy?.split("-")[0] as SortBy, sortBy?.split("-")[1] as SortOrd),
];
