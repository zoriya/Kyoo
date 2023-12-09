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
	Genre,
	ItemKind,
	KyooImage,
	LibraryItem,
	LibraryItemP,
	QueryIdentifier,
	WatchStatusV,
	getDisplayDate,
} from "@kyoo/models";
import {
	Chip,
	H3,
	Icon,
	IconFab,
	ImageBorderRadius,
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
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "solito/router";
import { Theme, percent, px, rem, useYoshiki } from "yoshiki/native";
import { Layout, WithLoading } from "../fetch";
import { InfiniteFetch } from "../fetch-infinite";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import { ItemGrid, ItemWatchStatus } from "../browse/grid";
import Done from "@material-symbols/svg-400/rounded/done-fill.svg";

export const ItemDetails = ({
	isLoading,
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
	const { push } = useRouter();
	const { t } = useTranslation();
	const { css } = useYoshiki("recommanded-card");

	return (
		<Link
			href={href}
			{...css(
				{
					height: ItemDetails.layout.size,
					flexDirection: "row",
					bg: (theme) => theme.variant.background,
					borderRadius: 12, // to make the border stick to the poster
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
				},
				props,
			)}
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
						{isLoading || <P {...css([{ m: 0, color: 'white' }, "title"])}>{name}</P>}
					</Skeleton>
					{(subtitle || isLoading) && (
						<Skeleton {...css({ height: rem(0.8) })}>
							{isLoading || <SubP {...css({ m: 0 })}>{subtitle}</SubP>}
						</Skeleton>
					)}
				</View>
				<ItemWatchStatus watchStatus={watchStatus} unseenEpisodesCount={unseenEpisodesCount} />
			</PosterBackground>
			<View {...css({ flexShrink: 1, flexGrow: 1, justifyContent: "flex-end" })}>
				{(isLoading || tagline) && (
					<Skeleton {...css({ m: ts(1), marginVertical: ts(2) })}>
						{isLoading || <P {...css({ p: ts(1) })}>{tagline}</P>}
					</Skeleton>
				)}
				<ScrollView {...css({ pX: ts(1) })}>
					<Skeleton lines={5} {...css({ height: rem(0.8) })}>
						{isLoading || (
							<SubP {...css({ textAlign: "justify" })}>{overview ?? t("show.noOverview")}</SubP>
						)}
					</Skeleton>
				</ScrollView>
				<View
					{...css({
						bg: (theme) => theme.themeOverlay,
						flexDirection: "row",
						pX: 4,
						justifyContent: "space-between",
						minHeight: px(50),
					})}
				>
					{(
						<ScrollView horizontal {...css({ alignItems: "center" })}>
							{(genres ?? Array(3))?.map((x, i) => (
								<Chip key={x ?? i} size="small" {...css({ mX: ts(0.5) })}>
									{x ?? <Skeleton {...css({ width: rem(3), height: rem(0.8) })} />}
								</Chip>
							))}
						</ScrollView>
					)}
					{playHref !== null && (
						<IconFab
							icon={PlayArrow}
							size={20}
							as={Pressable}
							onPress={() => push(playHref ?? "")}
							{...tooltip(t("show.play"))}
							{...css({ fover: { self: { transform: "scale(1.2)" as any, mX: ts(0.5) } } })}
						/>
					)}
				</View>
			</View>
		</Link>
	);
};

ItemDetails.layout = {
	size: ts(36),
	numColumns: { xs: 1, md: 2, xl: 3 },
	layout: "grid",
	gap: ts(8),
} satisfies Layout;

export const Recommanded = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<View {...css({ marginX: ItemGrid.layout.gap, marginTop: ItemGrid.layout.gap })}>
			<H3 {...css({ pX: ts(0.5) })}>{t("home.recommanded")}</H3>
			<InfiniteFetch
				query={Recommanded.query()}
				layout={ItemDetails.layout}
				placeholderCount={6}
				fetchMore={false}
				{...css({ padding: 0 })}
			>
				{(x) => (
					<ItemDetails
						isLoading={x.isLoading as any}
						name={x.name}
						tagline={"tagline" in x ? x.tagline : null}
						overview={x.overview}
						poster={x.poster}
						subtitle={
							x.kind !== ItemKind.Collection && !x.isLoading ? getDisplayDate(x) : undefined
						}
						genres={"genres" in x ? x.genres : null}
						href={x.href}
						playHref={x.kind !== ItemKind.Collection && !x.isLoading ? x.playHref : undefined}
						watchStatus={
							!x.isLoading && x.kind !== ItemKind.Collection ? x.watchStatus?.status ?? null : null
						}
						unseenEpisodesCount={
							x.kind === ItemKind.Show
								? x.watchStatus?.unseenEpisodesCount ?? x.episodesCount!
								: null
						}
					/>
				)}
			</InfiniteFetch>
		</View>
	);
};

Recommanded.query = (): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	infinite: true,
	path: ["items"],
	params: {
		sortBy: "random",
		limit: 6,
		fields: ["firstEpisode", "episodesCount", "watchStatus"],
	},
});
