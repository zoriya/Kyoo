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

import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { ItemGrid, itemMap } from "~/components/items";
import type { Genre, Show } from "~/models";
import { H3, ts } from "~/primitives";
import { InfiniteFetch, type QueryIdentifier } from "~/query";

export const Header = ({ title }: { title: string }) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css({
				marginTop: ItemGrid.layout.gap,
				marginX: ItemGrid.layout.gap,
				pX: ts(0.5),
				flexDirection: "row",
				justifyContent: "space-between",
			})}
		>
			<H3>{title}</H3>
		</View>
	);
};

export const GenreGrid = ({ genre }: { genre: Genre }) => {
	const displayEmpty = useRef(false);
	const { t } = useTranslation();

	return (
		<>
			<Header title={t(`genres.${genre}`)} />
			<InfiniteFetch
				query={GenreGrid.query(genre)}
				layout={{ ...ItemGrid.layout, layout: "horizontal" }}
				placeholderCount={2}
				empty={displayEmpty.current ? t("home.none") : undefined}
				Render={({ item }) => <ItemGrid {...itemMap(item)} />}
				Loader={ItemGrid.Loader}
			/>
		</>
	);
};

GenreGrid.query = (genre: Genre): QueryIdentifier<Show> => ({
	parser: Show,
	infinite: true,
	path: ["api", "shows"],
	params: {
		fields: ["watchStatus"],
		filter: `genres has ${genre}`,
		sort: "random",
		// Limit the initial numbers of items
		limit: 10,
	},
});
