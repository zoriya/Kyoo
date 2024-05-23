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
	type Genre,
	type LibraryItem,
	LibraryItemP,
	type QueryIdentifier,
	useInfiniteFetch,
} from "@kyoo/models";
import { H3, ts } from "@kyoo/primitives";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { itemMap } from "../browse";
import { ItemGrid } from "../browse/grid";
import { InfiniteFetchList } from "../fetch-infinite";

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
			{/* <View {...css({ flexDirection: "row" })}> */}
			{/* 	<IconButton */}
			{/* 		icon={ChevronLeft} */}
			{/* 		// onPress={() => ref.current?.scrollTo({ x: 0, animated: true })} */}
			{/* 	/> */}
			{/* 	<IconButton */}
			{/* 		icon={ChevronRight} */}
			{/* 		// onPress={() => ref.current?.scrollTo({ x: 0, animated: true })} */}
			{/* 	/> */}
			{/* </View> */}
		</View>
	);
};

export const GenreGrid = ({ genre }: { genre: Genre }) => {
	const query = useInfiniteFetch(GenreGrid.query(genre));
	const displayEmpty = useRef(false);
	const { t } = useTranslation();

	return (
		<>
			{(displayEmpty.current || query.items?.length !== 0) && (
				<Header title={t(`genres.${genre}`)} />
			)}
			<InfiniteFetchList
				query={query}
				layout={{ ...ItemGrid.layout, layout: "horizontal" }}
				placeholderCount={2}
				empty={displayEmpty.current ? t("home.none") : undefined}
				Render={({ item }) => <ItemGrid {...itemMap(item)} />}
				Loader={ItemGrid.Loader}
			/>
		</>
	);
};

GenreGrid.query = (genre: Genre): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	infinite: true,
	path: ["items"],
	params: {
		fields: ["watchStatus", "episodesCount"],
		filter: `genres has ${genre}`,
		sortBy: "random",
		// Limit the inital numbers of items
		limit: 10,
	},
});
