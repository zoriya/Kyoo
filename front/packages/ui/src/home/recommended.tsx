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
	type Genre,
	type KyooImage,
	type LibraryItem,
	LibraryItemP,
	type QueryIdentifier,
	type WatchStatusV,
	getDisplayDate,
} from "@kyoo/models";
import {
	Chip,
	H3,
	IconFab,
	imageBorderRadius,
	Link,
	P,
	PosterBackground,
	Skeleton,
	SubP,
	focusReset,
	tooltip,
	ts,
} from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { type Theme, calc, percent, px, rem, useYoshiki } from "yoshiki/native";
import type { Layout, WithLoading } from "../fetch";
import { InfiniteFetch } from "../fetch-infinite";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import { ItemGrid, ItemWatchStatus } from "../browse/grid";
import { useState } from "react";
import { ItemContext } from "../components/context-menus";

export const ItemDetails = ({
	isLoading,
	slug,
	type,
	name,
	tagline,
	subtitle,
	overview,
	poster,
	genres,
	href,
	playHref,
	watchStatus,
	unseenEpisodesCount,
	...props
}: WithLoading<{
	slug: string;
	type: "movie" | "show" | "collection";
	name: string;
	tagline: string | null;
	subtitle: string;
	poster: KyooImage | null;
	genres: Genre[] | null;
	overview: string | null;
	href: string;
	playHref: string | null;
	watchStatus: WatchStatusV | null;
	unseenEpisodesCount: number | null;
}>) => {
	const [moreOpened, setMoreOpened] = useState(false);
	const { css } = useYoshiki("recommended-card");
	const { t } = useTranslation();

	return (
		<View
			{...css(
				{
					height: ItemDetails.layout.size,
				},
				props,
			)}
		>
			<Link
				href={moreOpened ? undefined : href}
				onLongPress={() => setMoreOpened(true)}
				{...css({
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					flexDirection: "row",
					bg: (theme) => theme.variant.background,
					borderRadius: calc(px(imageBorderRadius), "+", ts(0.25)),
					overflow: "hidden",
					borderColor: (theme) => theme.background,
					borderWidth: ts(0.25),
					borderStyle: "solid",
					fover: {
						self: {
							...focusReset,
							borderColor: (theme: Theme) => theme.accent,
						},
						title: {
							textDecorationLine: "underline",
						},
					},
				})}
			>
				<PosterBackground
					src={poster}
					alt=""
					quality="low"
					forcedLoading={isLoading}
					layout={{ height: percent(100) }}
					style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
				>
					<View
						{...css({
							bg: (theme) => theme.darkOverlay,
							position: "absolute",
							left: 0,
							right: 0,
							bottom: 0,
							p: ts(1),
						})}
					>
						<Skeleton {...css({ width: percent(100) })}>
							{isLoading || (
								<P {...css([{ m: 0, color: (theme: Theme) => theme.colors.white }, "title"])}>
									{name}
								</P>
							)}
						</Skeleton>
						{(subtitle || isLoading) && (
							<Skeleton {...css({ height: rem(0.8) })}>
								{isLoading || <SubP {...css({ m: 0 })}>{subtitle}</SubP>}
							</Skeleton>
						)}
					</View>
					<ItemWatchStatus watchStatus={watchStatus} unseenEpisodesCount={unseenEpisodesCount} />
				</PosterBackground>
				<View
					{...css({ flexShrink: 1, flexGrow: 1, justifyContent: "flex-end", marginBottom: px(50) })}
				>
					<View
						{...css({
							flexDirection: "row-reverse",
							justifyContent: "space-between",
							alignContent: "flex-start",
						})}
					>
						{slug && type && type !== "collection" && watchStatus !== undefined && (
							<ItemContext
								type={type}
								slug={slug}
								status={watchStatus}
								isOpen={moreOpened}
								setOpen={(v) => setMoreOpened(v)}
								force
							/>
						)}
						{(isLoading || tagline) && (
							<Skeleton {...css({ m: ts(1), marginVertical: ts(2) })}>
								{isLoading || <P {...css({ p: ts(1) })}>{tagline}</P>}
							</Skeleton>
						)}
					</View>
					<ScrollView {...css({ pX: ts(1) })}>
						<Skeleton lines={5} {...css({ height: rem(0.8) })}>
							{isLoading || (
								<SubP {...css({ textAlign: "justify" })}>{overview ?? t("show.noOverview")}</SubP>
							)}
						</Skeleton>
					</ScrollView>
				</View>
			</Link>

			{/* This view needs to be out of the Link because nested <a> are not allowed on the web */}
			<View
				{...css({
					position: "absolute",
					// Take the border into account
					bottom: ts(0.25),
					right: ts(0.25),
					borderWidth: ts(0.25),
					borderColor: "transparent",
					borderBottomEndRadius: px(imageBorderRadius),
					overflow: "hidden",
					// Calculate the size of the poster
					left: calc(ItemDetails.layout.size, "*", 2 / 3),
					bg: (theme) => theme.themeOverlay,
					flexDirection: "row",
					pX: 4,
					justifyContent: "flex-end",
					height: px(50),
				})}
			>
				{(isLoading || genres) && (
					<ScrollView horizontal contentContainerStyle={{ alignItems: "center" }}>
						{(genres || [...Array(3)])?.map((x, i) => (
							<Chip key={x ?? i} label={x} size="small" {...css({ mX: ts(0.5) })} />
						))}
					</ScrollView>
				)}
				{playHref !== null && (
					<IconFab
						icon={PlayArrow}
						size={20}
						as={Link}
						href={playHref}
						{...tooltip(t("show.play"))}
						{...css({ fover: { self: { transform: "scale(1.2)" as any, mX: ts(0.5) } } })}
					/>
				)}
			</View>
		</View>
	);
};

ItemDetails.layout = {
	size: ts(36),
	numColumns: { xs: 1, md: 2, xl: 3 },
	layout: "grid",
	gap: ts(8),
} satisfies Layout;

export const Recommended = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<View {...css({ marginX: ItemGrid.layout.gap, marginTop: ItemGrid.layout.gap })}>
			<H3 {...css({ pX: ts(0.5) })}>{t("home.recommended")}</H3>
			<InfiniteFetch
				query={Recommended.query()}
				layout={ItemDetails.layout}
				placeholderCount={6}
				fetchMore={false}
				nested
				contentContainerStyle={{ padding: 0, paddingHorizontal: 0 }}
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
					/>
				)}
			</InfiniteFetch>
		</View>
	);
};

Recommended.query = (): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	infinite: true,
	path: ["items"],
	params: {
		sortBy: "random",
		limit: 6,
		fields: ["firstEpisode", "episodesCount", "watchStatus"],
	},
});
