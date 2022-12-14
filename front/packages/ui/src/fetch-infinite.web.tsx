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

import { Page, QueryIdentifier, useInfiniteFetch } from "@kyoo/models";
import { ReactElement, useRef } from "react";
import { Stylable, useYoshiki } from "yoshiki";
import { ErrorView, Layout, WithLoading } from "./fetch";

const InfiniteScroll = ({
	children,
	loader,
	layout = "vertical",
	loadMore,
	hasMore,
	isFetching,
	...props
}: {
	children?: ReactElement | (ReactElement | null)[] | null;
	loader?: (ReactElement | null)[];
	layout?: "vertical" | "horizontal" | "grid";
	loadMore: () => void;
	hasMore: boolean;
	isFetching: boolean;
} & Stylable) => {
	const ref = useRef<HTMLDivElement>(null);
	const { css } = useYoshiki();

	return (
		<div
			ref={ref}
			onScroll={() => {
				if (!ref.current || !hasMore || isFetching) return;
				const scroll =
					layout === "horizontal"
						? ref.current.scrollWidth - ref.current.scrollLeft
						: ref.current.scrollHeight - ref.current.scrollTop;
				const offset = layout === "horizontal" ? ref.current.offsetWidth : ref.current.offsetHeight;

				if (scroll <= offset * 1.2) loadMore();
			}}
			{...css(
				[
					{
						display: "flex",
						alignItems: "flex-start",
						overflow: "auto",
					},
					layout == "vertical" && {
						flexDirection: "column",
						alignItems: "stretch",
					},
					layout == "horizontal" && {
						flexDirection: "row",
						alignItems: "stretch",
					},
					layout === "grid" && {
						flexWrap: "wrap",
						justifyContent: "center",
					},
				],

				props,
			)}
		>
			{children}
			{hasMore && isFetching && loader}
		</div>
	);
};

export const InfiniteFetch = <Data,>({
	query,
	placeholderCount = 15,
	children,
	layout,
	horizontal = false,
	...props
}: {
	query: QueryIdentifier<Data>;
	placeholderCount?: number;
	layout: Layout;
	horizontal?: boolean;
	children: (
		item: Data extends Page<infer Item> ? WithLoading<Item> : WithLoading<Data>,
		key: string | undefined,
		i: number,
	) => ReactElement | null;
}): JSX.Element | null => {
	if (!query.infinite) console.warn("A non infinite query was passed to an InfiniteFetch.");

	const { items, error, fetchNextPage, hasNextPage, isFetching } = useInfiniteFetch(query);
	const grid = layout.numColumns !== 1;

	if (error) return <ErrorView error={error} />;

	return (
		<InfiniteScroll
			layout={grid ? "grid" : horizontal ? "horizontal" : "vertical"}
			loadMore={fetchNextPage}
			hasMore={hasNextPage!}
			isFetching={isFetching}
			loader={[...Array(12)].map((_, i) => children({ isLoading: true } as any, i.toString(), i))}
			{...props}
		>
			{items?.map((item, i) =>
				children({ ...item, isLoading: false } as any, (item as any).id?.toString(), i),
			)}
		</InfiniteScroll>
	);
};
