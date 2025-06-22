import { ItemGrid, ItemList, itemMap } from "~/components/items";
import { Show } from "~/models";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { useQueryState } from "~/utils";
import { BrowseSettings } from "./header";
import type { SortBy, SortOrd } from "./types";

export const BrowsePage = () => {
	const [filter, setFilter] = useQueryState("filter", "");
	const [sort, setSort] = useQueryState("sort", "name");
	const sortOrd = sort.startsWith("-") ? "desc" : "asc";
	const sortBy = (sort.startsWith("-") ? sort.substring(1) : sort) as SortBy;

	const [layout, setLayout] = useQueryState<"grid" | "list">("layout", "grid");
	const LayoutComponent = layout === "grid" ? ItemGrid : ItemList;

	return (
		<InfiniteFetch
			key={layout}
			query={BrowsePage.query(filter, sortBy, sortOrd)}
			layout={LayoutComponent.layout}
			Header={
				<BrowseSettings
					sortBy={sortBy}
					sortOrd={sortOrd}
					setSort={(key, ord) => {
						setSort(ord === "desc" ? `-${key}` : key);
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
	sortBy?: SortBy,
	sortOrd?: SortOrd,
): QueryIdentifier<Show> => {
	return {
		parser: Show,
		path: ["api", "shows"],
		infinite: true,
		params: {
			sort: sortBy ? `${sortOrd === "desc" ? "-" : ""}${sortBy}` : "name",
			filter,
		},
	};
};
