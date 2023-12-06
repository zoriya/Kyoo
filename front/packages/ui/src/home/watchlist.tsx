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
	QueryIdentifier,
	Watchlist,
	WatchlistKind,
	WatchlistP,
	getDisplayDate,
} from "@kyoo/models";
import { useYoshiki } from "yoshiki/native";
import { ItemGrid } from "../browse/grid";
import { InfiniteFetch } from "../fetch-infinite";
import { useTranslation } from "react-i18next";
import { Header } from "./genre";
import { EpisodeBox, episodeDisplayNumber } from "../details/episode";

export const WatchlistList = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<>
			<Header title={t("home.watchlist")} />
			<InfiniteFetch
				query={WatchlistList.query()}
				layout={{ ...ItemGrid.layout, layout: "horizontal" }}
				getItemType={(x, i) =>
					(x.kind === WatchlistKind.Show && x.watchStatus?.nextEpisode) || (x.isLoading && i % 2)
						? "episode"
						: "item"
				}
				empty={t("home.none")}
			>
				{(x, i) => {
					const episode = x.kind === WatchlistKind.Show ? x.watchStatus?.nextEpisode : null;
					return (x.kind === WatchlistKind.Show && x.watchStatus?.nextEpisode) ||
						(x.isLoading && i % 2) ? (
						<EpisodeBox
							isLoading={x.isLoading as any}
							name={episode ? `${x.name} ${episodeDisplayNumber(episode)}` : undefined}
							overview={episode?.name}
							thumbnail={episode?.thumbnail ?? x.thumbnail}
							href={episode?.href}
							watchedPercent={x.watchStatus?.watchedPercent || null}
							// TODO: support this on mobile too
							// @ts-expect-error This is a web only property
							{...css({ gridColumnEnd: "span 2" })}
						/>
					) : (
						<ItemGrid
							isLoading={x.isLoading as any}
							href={x.href}
							name={x.name!}
							subtitle={!x.isLoading ? getDisplayDate(x) : undefined}
							poster={x.poster}
							watchStatus={x.watchStatus?.status || null}
							watchPercent={x.watchStatus?.watchedPercent || null}
							unseenEpisodesCount={
								x.kind === WatchlistKind.Show ? x.watchStatus?.unseenEpisodesCount : null
							}
							type={x.kind === WatchlistKind.Movie ? "movie" : "show"}
						/>
					);
				}}
			</InfiniteFetch>
		</>
	);
};

WatchlistList.query = (): QueryIdentifier<Watchlist> => ({
	parser: WatchlistP,
	infinite: true,
	path: ["watchlist"],
	params: {
		// Limit the inital numbers of items
		limit: 10,
		fields: ["watchStatus"],
	},
});
