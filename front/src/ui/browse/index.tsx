import { ItemGrid, ItemList, itemMap } from "~/components/items";
import { Show } from "~/models";
import { useAccount } from "~/providers/account-context";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
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

	const [layout, setLayout] = useQueryState<"grid" | "list">("layout", "grid");
	const LayoutComponent = layout === "grid" ? ItemGrid : ItemList;

	return (
		<InfiniteFetch
			key={layout}
			query={BrowsePage.query({
				filter,
				sortBy,
				sortOrd,
				search,
				showCollectionItems,
			})}
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
		parser: Show,
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
