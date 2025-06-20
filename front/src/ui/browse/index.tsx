import { useState } from "react";
import { ItemGrid, itemMap } from "~/components/items";
import { ItemList } from "~/components/items";
import { Show } from "~/models";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { useQueryState } from "~/utils";
import { BrowseSettings } from "./header";
import type { SortBy, SortOrd } from "./types";

export const BrowsePage = () => {
	const [filter, setFilter] = useQueryState("filter", "");
	const [sort, setSort] = useQueryState("sortBy", "");
	const sortBy = (sort?.split(":")[0] as SortBy) || "name";
	const sortOrd = (sort?.split(":")[1] as SortOrd) || "asc";

	const [layout, setLayout] = useState<"grid" | "list">("grid");
	const LayoutComponent = layout === "grid" ? ItemGrid : ItemList;

	return (
		<InfiniteFetch
			query={BrowsePage.query(filter, sortBy, sortOrd)}
			layout={LayoutComponent.layout}
			Header={
				<BrowseSettings
					sortBy={sortBy}
					sortOrd={sortOrd}
					setSort={(key, ord) => {
						setSort(`${key}:${ord}`);
					}}
					filter={filter}
					setFilter={setFilter}
					layout={layout}
					setLayout={setLayout}
				/>
			}
			Render={({ item }) => <LayoutComponent {...itemMap(item)} />}
			Loader={LayoutComponent.Loader}
		/>
	);
};

BrowsePage.query = (
	filter?: string,
	sortKey?: SortBy,
	sortOrd?: SortOrd,
): QueryIdentifier<Show> => {
	return {
		parser: Show,
		path: ["shows"],
		infinite: true,
		params: {
			sort: sortKey ? `${sortKey}:${sortOrd ?? "asc"}` : "name:asc",
			filter,
		},
	};
};
