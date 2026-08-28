import { ItemGrid, ItemList, itemMap } from "~/components/items";
import { Show } from "~/models";
import { preferFocus } from "~/primitives";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { useQueryState } from "~/utils";
import { BrowseSettings } from "./header";
import type { SortBy, SortOrd } from "./types";

export const BrowsePage = () => {
	const [filter, setFilter] = useQueryState("filter", "");
	const [sort, setSort] = useQueryState("sort", "name");
	const [search] = useQueryState("q", "");
	// the nav rail's search entry lands here, and hands the focus to the field
	// rather than to the grid.
	const [focus] = useQueryState("focus", "");
	const sortOrd = sort.startsWith("-") ? "desc" : "asc";
	const sortBy = (sort.startsWith("-") ? sort.substring(1) : sort) as SortBy;

	const [layout, setLayout] = useQueryState<"grid" | "list">("layout", "grid");
	const LayoutComponent = layout === "grid" ? ItemGrid : ItemList;

	return (
		<InfiniteFetch
			key={layout}
			query={BrowsePage.query({ filter, sortBy, sortOrd, search })}
			incremental
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
					focusSearch={focus === "search"}
				/>
			}
			Render={({ item, index }) => (
				<LayoutComponent
					{...itemMap(item)}
					{...preferFocus(index === 0 && focus !== "search")}
				/>
			)}
			Loader={() => <LayoutComponent.Loader />}
		/>
	);
};

BrowsePage.query = ({
	filter,
	sortBy,
	sortOrd,
	search,
}: {
	filter?: string;
	sortBy?: SortBy;
	sortOrd?: SortOrd;
	search?: string;
}): QueryIdentifier<Show> => {
	return {
		parser: Show,
		path: ["api", "shows"],
		infinite: true,
		params: {
			sort: sortBy
				? `${sortOrd === "desc" ? "-" : ""}${sortBy === "rating" ? "rating:themoviedatabase" : sortBy}`
				: "name",
			filter,
			query: search,
		},
	};
};
