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

import { type Page, type QueryIdentifier, useInfiniteFetch } from "@kyoo/models";
import { HR } from "@kyoo/primitives";
import {
	type ComponentProps,
	type ComponentType,
	Fragment,
	isValidElement,
	type ReactElement,
	useCallback,
	useEffect,
	useRef,
} from "react";
import { type Stylable, nativeStyleToCss, useYoshiki, ysMap } from "yoshiki";
import { EmptyView, type Layout, type WithLoading, addHeader } from "./fetch";
import { ErrorView } from "./errors";
import type { ContentStyle } from "@shopify/flash-list";

const InfiniteScroll = <Props,>({
	children,
	loader,
	layout,
	loadMore,
	hasMore = true,
	isFetching,
	Header,
	headerProps,
	fetchMore = true,
	contentContainerStyle,
	...props
}: {
	children?: ReactElement | (ReactElement | null)[] | null;
	loader?: (ReactElement | null)[];
	layout: Layout;
	loadMore: () => void;
	hasMore: boolean;
	isFetching: boolean;
	Header?: ComponentType<Props & { children: JSX.Element }> | ReactElement;
	headerProps?: Props;
	fetchMore?: boolean;
	contentContainerStyle?: ContentStyle;
} & Stylable) => {
	const ref = useRef<HTMLDivElement>(null);
	const { css } = useYoshiki();

	const onScroll = useCallback(() => {
		if (!ref.current || !hasMore || isFetching || !fetchMore) return;
		const scroll =
			layout.layout === "horizontal"
				? ref.current.scrollWidth - ref.current.scrollLeft
				: ref.current.scrollHeight - ref.current.scrollTop;
		const offset =
			layout.layout === "horizontal" ? ref.current.offsetWidth : ref.current.offsetHeight;

		// Load more if less than 3 element's worth of scroll is left
		if (scroll <= offset * 3) loadMore();
	}, [hasMore, isFetching, layout, loadMore, fetchMore]);
	const scrollProps = { ref, onScroll };

	// Automatically trigger a scroll check on start and after a fetch end in case the user is already
	// at the bottom of the page or if there is no scroll bar (ultrawide or something like that)
	// biome-ignore lint/correctness/useExhaustiveDependencies: Check for scroll pause after fetch ends
	useEffect(() => {
		onScroll();
	}, [isFetching, onScroll]);

	const list = (props: object) => (
		<div
			{...css(
				[
					{
						display: "grid",
						gridAutoRows: "max-content",
						// the as any is due to differencies between css types of native and web (already accounted for in yoshiki)
						gridGap: layout.gap as any,
					},
					layout.layout === "vertical" && {
						gridTemplateColumns: "1fr",
						alignItems: "stretch",
						overflowY: "auto",
						paddingY: layout.gap as any,
					},
					layout.layout === "horizontal" && {
						alignItems: "stretch",
						overflowX: "auto",
						overflowY: "hidden",
						gridAutoFlow: "column",
						gridAutoColumns: ysMap(layout.numColumns, (x) => `${100 / x}%`),
						gridTemplateRows: "max-content",
						paddingX: layout.gap as any,
					},
					layout.layout === "grid" && {
						gridTemplateColumns: ysMap(layout.numColumns, (x) => `repeat(${x}, 1fr)`),
						justifyContent: "center",
						alignItems: "flex-start",
						overflowY: "auto",
						padding: layout.gap as any,
					},
					contentContainerStyle as any,
				],
				nativeStyleToCss(props),
			)}
		>
			{children}
			{isFetching && loader}
		</div>
	);

	if (!Header) return list({ ...scrollProps, ...props });
	if (!isValidElement(Header))
		return (
			// @ts-ignore
			<Header {...scrollProps} {...headerProps}>
				{list(props)}
			</Header>
		);
	return (
		<>
			{Header}
			{list({ ...scrollProps, ...props })}
		</>
	);
};

export const InfiniteFetchList = <Data, _, HeaderProps, Kind extends number | string>({
	query,
	incremental = false,
	placeholderCount = 2,
	children,
	layout,
	empty,
	divider: Divider = false,
	Header,
	headerProps,
	getItemType,
	getItemSize,
	nested,
	...props
}: {
	query: ReturnType<typeof useInfiniteFetch<_, Data>>;
	incremental?: boolean;
	placeholderCount?: number;
	layout: Layout;
	children: (
		item: Data extends Page<infer Item> ? WithLoading<Item> : WithLoading<Data>,
		i: number,
	) => ReactElement | null;
	empty?: string | JSX.Element;
	divider?: boolean | ComponentType;
	Header?: ComponentType<{ children: JSX.Element } & HeaderProps> | ReactElement;
	headerProps: HeaderProps;
	getItemType?: (item: WithLoading<Data>, index: number) => Kind;
	getItemSize?: (kind: Kind) => number;
	fetchMore?: boolean;
	contentContainerStyle?: ContentStyle;
	nested?: boolean;
}): JSX.Element | null => {
	const oldItems = useRef<Data[] | undefined>();
	const { items, error, fetchNextPage, hasNextPage, isFetching } = query;
	if (incremental && items) oldItems.current = items;

	if (error) return addHeader(Header, <ErrorView error={error} />, headerProps);
	if (empty && items && items.length === 0) {
		if (typeof empty !== "string") return addHeader(Header, empty, headerProps);
		return addHeader(Header, <EmptyView message={empty} />, headerProps);
	}

	return (
		<InfiniteScroll
			layout={layout}
			loadMore={fetchNextPage}
			hasMore={hasNextPage!}
			isFetching={isFetching}
			loader={[...Array(placeholderCount)].map((_, i) => (
				<Fragment key={i.toString()}>
					{Divider && i !== 0 && (Divider === true ? <HR /> : <Divider />)}
					{children({ isLoading: true } as any, i)}
				</Fragment>
			))}
			Header={Header}
			headerProps={headerProps}
			{...props}
		>
			{(items ?? oldItems.current)?.map((item, i) => (
				<Fragment key={(item as any).id}>
					{Divider && i !== 0 && (Divider === true ? <HR /> : <Divider />)}
					{children({ ...item, isLoading: false } as any, i)}
				</Fragment>
			))}
		</InfiniteScroll>
	);
};

export const InfiniteFetch = <Data, Props, _, Kind extends number | string>({
	query,
	...props
}: {
	query: QueryIdentifier<_, Data>;
} & Omit<ComponentProps<typeof InfiniteFetchList<Data, Props, _, Kind>>, "query">) => {
	if (!query.infinite) console.warn("A non infinite query was passed to an InfiniteFetch.");

	const ret = useInfiniteFetch(query);
	return <InfiniteFetchList query={ret} {...props} />;
};
