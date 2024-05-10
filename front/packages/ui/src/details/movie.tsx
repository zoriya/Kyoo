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

import { type Movie, MovieP, type QueryIdentifier, type QueryPage } from "@kyoo/models";
import { Platform, ScrollView } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { DefaultLayout } from "../layout";
import { Header } from "./header";
import { DetailsCollections } from "./collection";
import { usePageStyle } from "@kyoo/primitives";

const query = (slug: string): QueryIdentifier<Movie> => ({
	parser: MovieP,
	path: ["movie", slug],
	params: {
		fields: ["studio", "watchStatus"],
	},
});

export const MovieDetails: QueryPage<{ slug: string }> = ({ slug }) => {
	const { css } = useYoshiki();
	const pageStyle = usePageStyle();

	return (
		<ScrollView
			{...css([
				Platform.OS === "web" && {
					// @ts-ignore Web only property
					overflow: "auto" as any,
					// @ts-ignore Web only property
					overflowX: "hidden",
					// @ts-ignore Web only property
					overflowY: "overlay",
				},
				pageStyle,
			])}
		>
			<Header type="movie" query={query(slug)} />
			<DetailsCollections type="movie" slug={slug} />
			{/* <Staff slug={slug} /> */}
		</ScrollView>
	);
};

MovieDetails.getFetchUrls = ({ slug }) => [
	query(slug),
	DetailsCollections.query("movie", slug),
	// ShowStaff.query(slug),
];

MovieDetails.getLayout = { Layout: DefaultLayout, props: { transparent: true } };
