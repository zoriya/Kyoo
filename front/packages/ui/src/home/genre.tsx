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
	LibraryItem,
	LibraryItemP,
	Page,
	Paged,
	QueryIdentifier,
	getDisplayDate,
} from "@kyoo/models";
import { H3, IconButton, ts } from "@kyoo/primitives";
import { useRef } from "react";
import { ScrollView, View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { Fetch } from "../fetch";
import { ItemGrid } from "../browse/grid";
import ChevronLeft from "@material-symbols/svg-400/rounded/chevron_left-fill.svg";
import ChevronRight from "@material-symbols/svg-400/rounded/chevron_right-fill.svg";
import { InfiniteFetch } from "../fetch-infinite";

export const GenreGrid = ({ genre }: { genre: Genre }) => {
	const ref = useRef<ScrollView>(null);
	const { css } = useYoshiki();

	return (
		<View>
			<View {...css({ marginX: ts(1), flexDirection: "row", justifyContent: "space-between" })}>
				<H3>{genre}</H3>
				<View {...css({ flexDirection: "row" })}>
					<IconButton
						icon={ChevronLeft}
						onPress={() => ref.current?.scrollTo({ x: 0, animated: true })}
					/>
					<IconButton
						icon={ChevronRight}
						onPress={() => ref.current?.scrollTo({ x: 0, animated: true })}
					/>
				</View>
			</View>
			<InfiniteFetch
				query={GenreGrid.query(genre)}
				layout={{ ...ItemGrid.layout, layout: "horizontal" }}
			>
				{(x, i) => (
					<ItemGrid
						key={x.id ?? i}
						isLoading={x.isLoading as any}
						href={x.href}
						name={x.name}
						subtitle={
							x.kind !== ItemKind.Collection && !x.isLoading ? getDisplayDate(x) : undefined
						}
						poster={x.poster}
					/>
				)}
			</InfiniteFetch>
		</View>
	);
};

GenreGrid.query = (genre: Genre): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	infinite: true,
	path: ["items"],
	params: {
		genres: genre,
		sortBy: "random",
	},
});
