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
	ItemKind,
	LibraryItem,
	LibraryItemP,
	QueryIdentifier,
	getDisplayDate,
} from "@kyoo/models";
import { H3, ts } from "@kyoo/primitives";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { InfiniteFetch } from "../fetch-infinite";
import { ItemList } from "../browse/list";
import { useTranslation } from "react-i18next";

export const VerticalRecommanded = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<View>
			<H3 {...css({ mX: ts(1) })}>{t("home.recommanded")}</H3>
			<InfiniteFetch
				query={VerticalRecommanded.query()}
				layout={{ ...ItemList.layout, layout: "vertical" }}
			>
				{(x, i) => (
					<ItemList
						key={x.id ?? i}
						isLoading={x.isLoading as any}
						href={x.href}
						name={x.name}
						subtitle={
							x.kind !== ItemKind.Collection && !x.isLoading ? getDisplayDate(x) : undefined
						}
						poster={x.poster}
						thumbnail={x.thumbnail}
					/>
				)}
			</InfiniteFetch>
		</View>
	);
};

VerticalRecommanded.query = (): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	infinite: true,
	path: ["items"],
	params: {
		sortBy: "random",
		limit: 3,
	},
});
