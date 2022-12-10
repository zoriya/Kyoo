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
import { useBreakpointValue } from "@kyoo/primitives";
import { ReactElement } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useYoshiki } from "yoshiki";
import { ErrorView, Layout, WithLoading } from "./fetch";

export const InfiniteFetch = <Data,>({
	query,
	placeholderCount = 15,
	children,
	layout,
	...props
}: {
	query: QueryIdentifier<Data>;
	placeholderCount?: number;
	layout: Layout;
	children: (
		item: Data extends Page<infer Item> ? WithLoading<Item> : WithLoading<Data>,
		key: string | undefined,
		i: number,
	) => ReactElement | null;
}): JSX.Element | null => {
	if (!query.infinite) console.warn("A non infinite query was passed to an InfiniteFetch.");

	const { items, error, fetchNextPage, hasNextPage } = useInfiniteFetch(query);
	const { numColumns } = useBreakpointValue(layout);
	const { css } = useYoshiki();

	if (error) return <ErrorView error={error} />;

	return (
		<InfiniteScroll
			scrollableTarget="main" // Default to the main element for the scroll.
			dataLength={items?.length ?? 0}
			next={fetchNextPage}
			hasMore={hasNextPage!}
			loader={[...Array(12)].map((_, i) => children({ isLoading: true } as any, i.toString(), i))}
			{...css(
				[
					{
						display: "flex",
						alignItems: "flex-start",
						justifyContent: "center",
					},
					numColumns === 1 && {
						flexDirection: "column",
					},
					numColumns !== 1 && {
						flexWrap: "wrap",
					},
				],

				props,
			)}
		>
			{items?.map((item, i) =>
				children({ ...item, isLoading: false } as any, (item as any).id?.toString(), i),
			)}
		</InfiniteScroll>
	);
};
