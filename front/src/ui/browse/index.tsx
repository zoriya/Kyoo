import { useDeferredValue } from "react";
import { ItemGrid, ItemList, itemMap } from "~/components/items";
import { InfiniteFetch, type QueryIdentifier } from "~/data";
import { Show } from "~/models";
import { useAccount } from "~/providers/account-context";
import { useQueryState } from "~/utils";
import { BrowseSettings } from "./header";
import type { SortBy, SortOrd } from "./types";

export const BrowsePage = () => {
	const account = useAccount();
	const showCollectionItems =
		account?.claims.settings.showCollectionItems ?? false;
	const [filter, setFilter] = useQueryState("filter", "");
	const [sort, setSort] = useQueryState("sort", "name");
	const [search] = useQueryState("q", "");
	const sortOrd = sort.startsWith("-") ? "desc" : "asc";
	const sortBy = (sort.startsWith("-") ? sort.substring(1) : sort) as SortBy;
	const listFilter = useDeferredValue(filter);
	const listSortBy = useDeferredValue(sortBy);
	const listSortOrd = useDeferredValue(sortOrd);
	const listSearch = useDeferredValue(search);

	const [layout, setLayout] = useQueryState<"grid" | "list">("layout", "grid");
	const LayoutComponent = layout === "grid" ? ItemGrid : ItemList;

	return (
		<InfiniteFetch
			key={layout}
			query={BrowsePage.query({
				filter: listFilter,
				sortBy: listSortBy,
				sortOrd: listSortOrd,
				search: listSearch,
				showCollectionItems,
			})}
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
			Loader={() => <LayoutComponent.Loader />}
		/>
	);
};

BrowsePage.query = ({
	filter,
	sortBy,
	sortOrd,
	search,
	showCollectionItems,
}: {
	filter?: string;
	sortBy?: SortBy;
	sortOrd?: SortOrd;
	search?: string;
	showCollectionItems?: boolean;
}): QueryIdentifier<Show> => {
	return {
		schema: Show,
		path: ["api", "shows"],
		infinite: true,
		params: {
			sort: sortBy
				? `${sortOrd === "desc" ? "-" : ""}${sortBy === "rating" ? "rating:themoviedatabase" : sortBy}`
				: "name",
			filter,
			query: search,
			// The api hides collection members by default; only send the param to opt out.
			ignoreInCollection: showCollectionItems ? false : undefined,
		},
	};
};
