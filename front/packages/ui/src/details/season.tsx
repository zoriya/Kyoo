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
	type Episode,
	EpisodeP,
	type QueryIdentifier,
	type Season,
	SeasonP,
	useInfiniteFetch,
} from "@kyoo/models";
import { Skeleton, H6, HR, P, ts, Menu, IconButton, tooltip, usePageStyle } from "@kyoo/primitives";
import { rem, useYoshiki } from "yoshiki/native";
import { View } from "react-native";
import { InfiniteFetch } from "../fetch-infinite";
import { episodeDisplayNumber, EpisodeLine } from "./episode";
import { useTranslation } from "react-i18next";
import type { ComponentType } from "react";
import MenuIcon from "@material-symbols/svg-400/rounded/menu-fill.svg";

type SeasonProcessed = Season & { href: string };

export const SeasonHeader = ({
	isLoading,
	seasonNumber,
	name,
	seasons,
}: {
	isLoading: boolean;
	seasonNumber?: number;
	name?: string;
	seasons?: SeasonProcessed[];
}) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<View id={`season-${seasonNumber}`}>
			<View {...css({ flexDirection: "row", marginX: ts(1) })}>
				<P
					{...css({
						width: rem(4),
						flexShrink: 0,
						marginX: ts(1),
						textAlign: "center",
						fontSize: rem(1.5),
					})}
				>
					{isLoading ? <Skeleton variant="filltext" /> : seasonNumber}
				</P>
				<H6
					aria-level={2}
					{...css({ marginX: ts(1), fontSize: rem(1.5), flexGrow: 1, flexShrink: 1 })}
				>
					{isLoading ? <Skeleton /> : name}
				</H6>
				<Menu Trigger={IconButton} icon={MenuIcon} {...tooltip(t("show.jumpToSeason"))}>
					{seasons
						?.filter((x) => x.episodesCount > 0)
						.map((x) => (
							<Menu.Item
								key={x.seasonNumber}
								label={`${x.seasonNumber}: ${x.name} (${x.episodesCount})`}
								href={x.href}
							/>
						))}
				</Menu>
			</View>
			<HR />
		</View>
	);
};

SeasonHeader.query = (slug: string): QueryIdentifier<Season, SeasonProcessed> => ({
	parser: SeasonP,
	path: ["show", slug, "seasons"],
	params: {
		// Fetch all seasons at one, there won't be hundred of thems anyways.
		limit: 0,
		fields: ["episodesCount"],
	},
	infinite: {
		value: true,
		map: (seasons) =>
			seasons.map((x) => ({ ...x, href: `/show/${slug}?season=${x.seasonNumber}` })),
	},
});

export const EpisodeList = <Props,>({
	slug,
	season,
	Header,
	headerProps,
}: {
	slug: string;
	season: string | number;
	Header: ComponentType<Props & { children: JSX.Element }>;
	headerProps: Props;
}) => {
	const pageStyle = usePageStyle();
	const { t } = useTranslation();
	const { items: seasons, error } = useInfiniteFetch(SeasonHeader.query(slug));

	if (error) console.error("Could not fetch seasons", error);

	return (
		<InfiniteFetch
			query={EpisodeList.query(slug, season)}
			layout={EpisodeLine.layout}
			empty={t("show.episode-none")}
			divider
			Header={Header}
			headerProps={headerProps}
			getItemType={(item) => (item.firstOfSeason ? "withHeader" : "normal")}
			contentContainerStyle={pageStyle}
		>
			{(item) => {
				const sea = item?.firstOfSeason
					? seasons?.find((x) => x.seasonNumber === item.seasonNumber)
					: null;
				return (
					<>
						{item.firstOfSeason && (
							<SeasonHeader
								isLoading={!sea}
								name={sea?.name}
								seasonNumber={sea?.seasonNumber}
								seasons={seasons}
							/>
						)}
						<EpisodeLine
							{...item}
							showSlug={null}
							displayNumber={item.isLoading ? undefined! : episodeDisplayNumber(item)!}
							watchedPercent={item.watchStatus?.watchedPercent ?? null}
							watchedStatus={item.watchStatus?.status ?? null}
						/>
					</>
				);
			}}
		</InfiniteFetch>
	);
};

EpisodeList.query = (
	slug: string,
	season: string | number,
): QueryIdentifier<Episode, Episode & { firstOfSeason?: boolean }> => ({
	parser: EpisodeP,
	path: ["show", slug, "episode"],
	params: {
		filter: season ? `seasonNumber gte ${season}` : undefined,
		fields: ["watchStatus"],
	},
	infinite: {
		value: true,
		map: (episodes) => {
			let currentSeason: number | null = null;
			return episodes.map((x) => {
				if (x.seasonNumber === currentSeason) return x;
				currentSeason = x.seasonNumber;
				return { ...x, firstOfSeason: true };
			});
		},
	},
});
