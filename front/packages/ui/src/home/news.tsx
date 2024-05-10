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
import { ItemGrid } from "../browse/grid";
import { InfiniteFetch } from "../fetch-infinite";
import { useTranslation } from "react-i18next";
import { Header } from "./genre";
import { EpisodeBox, episodeDisplayNumber } from "../details/episode";
import { useYoshiki } from "yoshiki/native";

export const NewsList = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<>
			<Header title={t("home.news")} />
			<InfiniteFetch
				query={NewsList.query()}
				layout={{ ...ItemGrid.layout, layout: "horizontal" }}
				getItemType={(x, i) => (x.kind === "movie" || (x.isLoading && i % 2) ? "movie" : "episode")}
				getItemSize={(kind) => (kind === "episode" ? 2 : 1)}
				empty={t("home.none")}
			>
				{(x, i) =>
					x.kind === "movie" || (x.isLoading && i % 2) ? (
						<ItemGrid
							isLoading={x.isLoading as any}
							href={x.href}
							slug={x.slug}
							name={x.name!}
							subtitle={!x.isLoading ? getDisplayDate(x) : undefined}
							poster={x.poster}
							watchStatus={x.watchStatus?.status || null}
							watchPercent={x.watchStatus?.watchedPercent || null}
							type={"movie"}
						/>
					) : (
						<EpisodeBox
							isLoading={x.isLoading as any}
							slug={x.slug}
							showSlug={x.kind === "episode" ? x.show!.slug : null}
							name={x.kind === "episode" ? `${x.show!.name} ${episodeDisplayNumber(x)}` : undefined}
							overview={x.name}
							thumbnail={x.thumbnail}
							href={x.href}
							watchedPercent={x.watchStatus?.watchedPercent || null}
							watchedStatus={x.watchStatus?.status || null}
							// TODO: Move this into the ItemList (using getItemSize)
							// @ts-expect-error This is a web only property
							{...css({ gridColumnEnd: "span 2" })}
						/>
					)
				}
			</InfiniteFetch>
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
