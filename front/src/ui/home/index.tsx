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

import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { Genre } from "~/models";
import { Fetch, prefetch } from "~/query";
import { GenreGrid } from "./genre";
import { Header } from "./header";
import { NewsList } from "./news";
import { Recommended } from "./recommended";
import { VerticalRecommended } from "./vertical";
import { WatchlistList } from "./watchlist";

export async function loader() {
	const randomItems = [...Object.values(Genre)];
	await Promise.all([
		prefetch(Header.query()),
		prefetch(WatchlistList.query()),
		prefetch(NewsList.query()),
		...randomItems.filter((_, i) => i < 6).map((x) => prefetch(GenreGrid.query(x))),
		prefetch(Recommended.query()),
		prefetch(VerticalRecommended.query()),
	]);
}

export const HomePage = () => {
	const [refreshing, setRefreshing] = useState(false);
	const randomItems = [...Object.values(Genre)];

	return (
		<ScrollView
			refreshControl={
				<RefreshControl
					onRefresh={async () => {
						setRefreshing(true);
						await loader();
						setRefreshing(false);
					}}
					refreshing={refreshing}
				/>
			}
		>
			<Fetch
				query={Header.query()}
				Render={(x) => (
					<Header
						isLoading={false}
						name={x.name}
						tagline={x.kind !== "collection" && "tagline" in x ? x.tagline : null}
						description={x.description}
						thumbnail={x.thumbnail}
						link={x.kind !== "collection" ? x.playHref : null}
						infoLink={x.href}
					/>
				)}
				Loader={() => (
					<Header
						isLoading={true}
						name=""
						tagline={null}
						description={null}
						thumbnail={null}
						link={null}
						infoLink="#"
					/>
				)}
			/>
			<WatchlistList />
			<NewsList />
			{randomItems
				.filter((_, i) => i < 2)
				.map((x) => (
					<GenreGrid key={x} genre={x} />
				))}
			<Recommended />
			{randomItems
				.filter((_, i) => i >= 2 && i < 6)
				.map((x) => (
					<GenreGrid key={x} genre={x} />
				))}
			<VerticalRecommended />
			{/*
				TODO: Lazy load those items
				{randomItems.filter((_, i) => i >= 6).map((x) => <GenreGrid key={x} genre={x} />)}
			*/}
		</ScrollView>
	);
};
