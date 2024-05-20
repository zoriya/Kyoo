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
	type QueryIdentifier,
	type Watchlist,
	WatchlistP,
	getDisplayDate,
	useAccount,
} from "@kyoo/models";
import { Button, P, ts } from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { ItemGrid } from "../browse/grid";
import { EpisodeBox, episodeDisplayNumber } from "../details/episode";
import { InfiniteFetch } from "../fetch-infinite";
import { Header } from "./genre";

export const WatchlistList = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();
	const account = useAccount();

	if (!account) {
		return (
			<>
				<Header title={t("home.watchlist")} />
				<View {...css({ justifyContent: "center", alignItems: "center" })}>
					<P>{t("home.watchlistLogin")}</P>
					<Button
						text={t("login.login")}
						href={"/login"}
						{...css({ minWidth: ts(24), margin: ts(2) })}
					/>
				</View>
			</>
		);
	}

	return (
		<>
			<Header title={t("home.watchlist")} />
			<InfiniteFetch
				query={WatchlistList.query()}
				layout={{ ...ItemGrid.layout, layout: "horizontal" }}
				getItemType={(x, i) =>
					(x?.kind === "show" && x.watchStatus?.nextEpisode) || (!x && i % 2) ? "episode" : "item"
				}
				getItemSize={(kind) => (kind === "episode" ? 2 : 1)}
				empty={t("home.none")}
				Render={({ item }) => {
					const episode = item.kind === "show" ? item.watchStatus?.nextEpisode : null;
					if (episode) {
						return (
							<EpisodeBox
								slug={episode.slug}
								showSlug={item.slug}
								name={`${item.name} ${episodeDisplayNumber(episode)}`}
								overview={episode.name}
								thumbnail={episode.thumbnail ?? item.thumbnail}
								href={episode.href}
								watchedPercent={item.watchStatus?.watchedPercent || null}
								watchedStatus={item.watchStatus?.status || null}
								// TODO: Move this into the ItemList (using getItemSize)
								// @ts-expect-error This is a web only property
								{...css({ gridColumnEnd: "span 2" })}
							/>
						);
					}
					return (
						<ItemGrid
							href={item.href}
							slug={item.slug}
							name={item.name!}
							subtitle={getDisplayDate(item)}
							poster={item.poster}
							watchStatus={item.watchStatus?.status || null}
							watchPercent={item.watchStatus?.watchedPercent || null}
							unseenEpisodesCount={
								(item.kind === "show" && item.watchStatus?.unseenEpisodesCount) || null
							}
							type={item.kind}
						/>
					);
				}}
				Loader={({ index }) => (index % 2 ? <EpisodeBox.Loader /> : <ItemGrid.Loader />)}
			/>
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
