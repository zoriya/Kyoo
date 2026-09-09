import { ItemGrid, ItemList, itemMap } from "~/components/items";
import { and, ilike, type InitialQueryBuilder } from "@tanstack/react-db";
import { parseFilter, showFields, shows } from "~/db";
import { InfiniteList } from "~/query";
import { useQueryState } from "~/utils";
import { BrowseSettings } from "./header";
import type { SortBy, SortOrd } from "./types";

export const BrowsePage = () => {
	const [filter, setFilter] = useQueryState("filter", "");
	const [sort, setSort] = useQueryState("sort", "name");
	const [search] = useQueryState("q", "");
	const sortOrd = sort.startsWith("-") ? "desc" : "asc";
	const sortBy = (sort.startsWith("-") ? sort.substring(1) : sort) as SortBy;

	const [layout, setLayout] = useQueryState<"grid" | "list">("layout", "grid");
	const LayoutComponent = layout === "grid" ? ItemGrid : ItemList;

	return (
		<InfiniteList
			key={layout}
			query={(q) => BrowsePage.query(q, { filter, sortBy, sortOrd, search })}
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

BrowsePage.query = (
	q: InitialQueryBuilder,
	{
		filter,
		sortBy = "name",
		sortOrd = "asc",
		search,
	}: {
		filter?: string;
		sortBy?: SortBy;
		sortOrd?: SortOrd;
		search?: string;
	},
) => {
	// The user typed filter runs both locally and server side.
	let where: ReturnType<typeof parseFilter> | undefined;
	try {
		where = filter ? parseFilter(filter, showFields) : undefined;
	} catch (e) {
		console.log("Invalid filter", filter, e);
	}
	return q
		.from({ s: shows })
		.where(({ s }) =>
			and(where?.(s) ?? true, search ? ilike(s.name, `%${search}%`) : true),
		)
		.orderBy(
			({ s }) =>
				sortBy === "rating"
					? s.rating.themoviedatabase
					: sortBy === "startAir"
						? s.startAir
						: sortBy === "endAir"
							? s.endAir
							: sortBy === "createdAt"
								? s.createdAt
								: s.name,
			sortOrd,
		);
};
