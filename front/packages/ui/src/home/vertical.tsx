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

import { type LibraryItem, LibraryItemP, type QueryIdentifier } from "@kyoo/models";
import { H3 } from "@kyoo/primitives";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { InfiniteFetch } from "../fetch-infinite";
import { ItemList } from "../browse/list";
import { useTranslation } from "react-i18next";
import { ItemGrid } from "../browse/grid";
import { itemMap } from "../browse";

export const VerticalRecommended = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<View {...css({ marginY: ItemGrid.layout.gap })}>
			<H3 {...css({ mX: ItemGrid.layout.gap })}>{t("home.recommended")}</H3>
			<InfiniteFetch
				query={VerticalRecommended.query()}
				placeholderCount={3}
				layout={{ ...ItemList.layout, layout: "vertical" }}
				fetchMore={false}
				nested
			>
				{(x, i) => <ItemList key={x.id ?? i} {...itemMap(x)} />}
			</InfiniteFetch>
		</View>
	);
};

VerticalRecommended.query = (): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	infinite: true,
	path: ["items"],
	params: {
		fields: ["episodesCount", "watchStatus"],
		sortBy: "random",
		limit: 3,
	},
});
