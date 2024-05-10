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
	type Collection,
	CollectionP,
	type LibraryItem,
	LibraryItemP,
	type QueryIdentifier,
	type QueryPage,
	getDisplayDate,
} from "@kyoo/models";
import { Header as ShowHeader, TitleLine } from "../details/header";
import { Container, Head, ImageBackground, P, Skeleton, ts, usePageStyle } from "@kyoo/primitives";
import { percent, px, useYoshiki } from "yoshiki/native";
import { useTranslation } from "react-i18next";
import { forwardRef } from "react";
import { Platform, View, type ViewProps } from "react-native";
import { Fetch } from "../fetch";
import { InfiniteFetch } from "../fetch-infinite";
import { DefaultLayout } from "../layout";
import { ItemDetails } from "../home/recommended";
import { SvgWave } from "../details/show";
import { ItemGrid } from "../browse/grid";

const Header = ({ slug }: { slug: string }) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<Fetch query={Header.query(slug)}>
			{({ isLoading, ...data }) => (
				<>
					<Head title={data?.name} description={data?.overview} image={data?.thumbnail?.high} />

					<ImageBackground
						src={data?.thumbnail}
						quality="high"
						alt=""
						containerStyle={ShowHeader.containerStyle}
					>
						<TitleLine
							isLoading={isLoading}
							type={"collection"}
							playHref={null}
							name={data?.name}
							tagline={null}
							date={null}
							rating={null}
							runtime={null}
							poster={data?.poster}
							trailerUrl={null}
							studio={null}
							{...css(ShowHeader.childStyle)}
						/>
					</ImageBackground>

					<Container
						{...css({
							paddingTop: ts(4),
							marginBottom: ts(4),
						})}
					>
						<Skeleton lines={4}>
							{isLoading || (
								<P {...css({ textAlign: "justify" })}>{data.overview ?? t("show.noOverview")}</P>
							)}
						</Skeleton>
					</Container>
				</>
			)}
		</Fetch>
	);
};

Header.query = (slug: string): QueryIdentifier<Collection> => ({
	parser: CollectionP,
	path: ["collections", slug],
});

const CollectionHeader = forwardRef<View, ViewProps & { slug: string }>(function ShowHeader(
	{ children, slug, ...props },
	ref,
) {
	const { css, theme } = useYoshiki();

	return (
		<View
			ref={ref}
			{...css(
				[
					{ bg: (theme) => theme.variant.background },
					Platform.OS === "web" && {
						flexGrow: 1,
						flexShrink: 1,
						// @ts-ignore Web only property
						overflowY: "auto" as any,
					},
				],
				props,
			)}
		>
			<Header slug={slug} />
			<SvgWave fill={theme.background} {...css({ flexShrink: 0, flexGrow: 1, display: "flex" })} />
			<View {...css({ bg: theme.background, paddingTop: { xs: ts(8), md: 0 } })}>
				<View
					{...css({
						width: percent(100),
						maxWidth: { xs: percent(100), lg: px(1170) },
						alignSelf: "center",
					})}
				>
					{children}
				</View>
			</View>
		</View>
	);
});

const query = (slug: string): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	path: ["collections", slug, "items"],
	infinite: true,
	params: {
		fields: ["firstEpisode", "episodesCount", "watchStatus"],
	},
});

export const CollectionPage: QueryPage<{ slug: string }> = ({ slug }) => {
	const { css } = useYoshiki();
	const pageStyle = usePageStyle();

	return (
		<InfiniteFetch
			query={query(slug)}
			placeholderCount={2}
			layout={{ ...ItemDetails.layout, numColumns: { xs: 1, md: 2 } }}
			Header={CollectionHeader}
			headerProps={{ slug }}
			contentContainerStyle={{ padding: 0, paddingHorizontal: 0, ...pageStyle }}
		>
			{(x) => (
				<ItemDetails
					isLoading={x.isLoading as any}
					slug={x.slug}
					type={x.kind}
					name={x.name}
					tagline={"tagline" in x ? x.tagline : null}
					overview={x.overview}
					poster={x.poster}
					subtitle={x.kind !== "collection" && !x.isLoading ? getDisplayDate(x) : undefined}
					genres={"genres" in x ? x.genres : null}
					href={x.href}
					playHref={x.kind !== "collection" && !x.isLoading ? x.playHref : undefined}
					watchStatus={
						!x.isLoading && x.kind !== "collection" ? x.watchStatus?.status ?? null : null
					}
					unseenEpisodesCount={
						x.kind === "show" ? x.watchStatus?.unseenEpisodesCount ?? x.episodesCount! : null
					}
					{...css({ marginX: ItemGrid.layout.gap })}
				/>
			)}
		</InfiniteFetch>
	);
};

CollectionPage.getLayout = { Layout: DefaultLayout, props: { transparent: true } };

CollectionPage.getFetchUrls = ({ slug }) => [query(slug), Header.query(slug)];
