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

import { Genre, ItemKind, QueryPage } from "@kyoo/models";
import { Fetch } from "../fetch";
import { Header } from "./header";
import { DefaultLayout } from "../layout";
import { ScrollView, View } from "react-native";
import { GenreGrid } from "./genre";
import { Recommanded } from "./recommanded";

export const HomePage: QueryPage<{}, Genre> = ({ randomItems }) => {
	return (
		<ScrollView>
			<Fetch query={Header.query()}>
				{(x) => (
					<Header
						isLoading={x.isLoading as any}
						name={x.name}
						tagline={"tagline" in x ? x.tagline : null}
						overview={x.overview}
						thumbnail={x.thumbnail}
						link={x.kind === ItemKind.Show ? `/watch/${x.slug}-s1e1` : `/movie/${x.slug}/watch`}
						infoLink={x.href}
					/>
				)}
			</Fetch>
			{/* <News /> */}
			{randomItems.filter((_, i) => i < 2).map((x) =>
				<GenreGrid key={x} genre={x} />,
			)}
			<Recommanded />
			{randomItems.filter((_, i) => i >= 2).map((x) =>
				<GenreGrid key={x} genre={x} />,
			)}
		</ScrollView>
	);
};

HomePage.randomItems = [...Object.values(Genre)];

HomePage.getLayout = { Layout: DefaultLayout, props: { transparent: true } };

HomePage.getFetchUrls = () => [
	Header.query(),
	...Object.values(Genre).map((x) => GenreGrid.query(x)),
	Recommanded.query(),
];
