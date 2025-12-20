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

import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { EntryBox, entryDisplayNumber } from "~/components/entries";
import { ItemGrid } from "~/components/items";
import type { Show } from "~/models";
import { getDisplayDate } from "~/utils";
import { Button, P, ts } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
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
					(x?.kind === "serie" && x.nextEntry) || (!x && i % 2) ? "episode" : "item"
				}
				getItemSize={(kind) => (kind === "episode" ? 2 : 1)}
				empty={t("home.none")}
				Render={({ item }) => {
					const entry = item.kind === "serie" ? item.nextEntry : null;
					if (entry) {
						return (
							<EntryBox
								slug={entry.slug}
								serieSlug={item.slug}
								name={`${item.name} ${entryDisplayNumber(entry)}`}
								description={entry.name}
								thumbnail={entry.thumbnail ?? item.thumbnail}
								href={entry.href ?? "#"}
								watchedPercent={entry.watchStatus?.percent || null}
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
							kind={item.kind}
							name={item.name!}
							subtitle={getDisplayDate(item)}
							poster={item.poster}
							watchStatus={item.watchStatus?.status || null}
							watchPercent={item.kind === "movie" && item.watchStatus ? item.watchStatus.percent : null}
							unseenEpisodesCount={null}
						/>
					);
				}}
				Loader={({ index }) => (index % 2 ? <EntryBox.Loader /> : <ItemGrid.Loader />)}
			/>
		</>
	);
};

WatchlistList.query = (): QueryIdentifier<Show> => ({
	parser: Show,
	infinite: true,
	path: ["api", "watchlist"],
	params: {
		// Limit the initial numbers of items
		limit: 10,
		fields: ["watchStatus", "nextEntry"],
	},
});
