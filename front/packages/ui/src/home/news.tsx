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

import { type News, NewsP, type QueryIdentifier, getDisplayDate } from "@kyoo/models";
import { useTranslation } from "react-i18next";
import { useYoshiki } from "yoshiki/native";
import { ItemGrid } from "../browse/grid";
import { EpisodeBox, episodeDisplayNumber } from "../details/episode";
import { InfiniteFetch } from "../fetch-infinite";
import { Header } from "./genre";

export const NewsList = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<>
			<Header title={t("home.news")} />
			<InfiniteFetch
				query={NewsList.query()}
				layout={{ ...ItemGrid.layout, layout: "horizontal" }}
				getItemType={(x, i) => (x?.kind === "movie" || (!x && i % 2) ? "movie" : "episode")}
				getItemSize={(kind) => (kind === "episode" ? 2 : 1)}
				empty={t("home.none")}
				Render={({ item }) => {
					if (item.kind === "episode") {
						return (
							<EpisodeBox
								slug={item.slug}
								showSlug={item.show!.slug}
								name={`${item.show!.name} ${episodeDisplayNumber(item)}`}
								overview={item.name}
								thumbnail={item.thumbnail}
								href={item.href}
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
							unseenEpisodesCount={null}
							type={"movie"}
						/>
					);
				}}
				Loader={({ index }) => (index % 2 ? <EpisodeBox.Loader /> : <ItemGrid.Loader />)}
			/>
		</>
	);
};

NewsList.query = (): QueryIdentifier<News> => ({
	parser: NewsP,
	infinite: true,
	path: ["news"],
	params: {
		// Limit the inital numbers of items
		limit: 10,
		fields: ["show", "watchStatus"],
	},
});
