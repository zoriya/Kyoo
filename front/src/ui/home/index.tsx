import { RefreshControl, ScrollView } from "react-native";
import { Genre } from "~/models";
import { Fetch, useRefresh } from "~/query";
import { shuffle } from "~/utils";
import { GenreGrid } from "./genre";
import { Header } from "./header";
import { NewsList } from "./news";
import { Recommended } from "./recommended";
import { VerticalRecommended } from "./vertical";
import { WatchlistList } from "./watchlist";

export const HomePage = () => {
	const genres = shuffle(Object.values(Genre.enum));
	const [isRefreshing, refresh] = useRefresh(HomePage.queries(genres));

	return (
		<ScrollView
			refreshControl={
				<RefreshControl onRefresh={refresh} refreshing={isRefreshing} />
			}
		>
			<Fetch
				query={Header.query()}
				Render={(x) => (
					<Header
						name={x.name}
						tagline={x.kind !== "collection" ? x.tagline : null}
						description={x.description}
						thumbnail={x.thumbnail}
						link={x.kind !== "collection" ? x.playHref : null}
						infoLink={x.href}
					/>
				)}
				Loader={Header.Loader}
			/>
			<WatchlistList />
			<NewsList />
			{genres
				.filter((_, i) => i < 2)
				.map((x) => (
					<GenreGrid key={x} genre={x} />
				))}
			<Recommended />
			{genres
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

HomePage.queries = (randomItems: Genre[]) => [
	Header.query(),
	WatchlistList.query(),
	NewsList.query(),
	...randomItems.filter((_, i) => i < 6).map((x) => GenreGrid.query(x)),
	Recommended.query(),
	VerticalRecommended.query(),
];
