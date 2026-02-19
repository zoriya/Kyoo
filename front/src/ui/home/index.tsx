import { useState } from "react";
import { RefreshControl } from "react-native";
import Animated from "react-native-reanimated";
import { Genre } from "~/models";
import { Fetch, useRefresh } from "~/query";
import { shuffle } from "~/utils";
import { HeaderBackground, useScrollNavbar } from "../navbar";
import { GenreGrid } from "./genre";
import { Header } from "./header";
import { NewsList } from "./news";
import { NextupList } from "./nextup";
import { Recommended } from "./recommended";
import { VerticalRecommended } from "./vertical";

export const HomePage = () => {
	const genres = shuffle(Object.values(Genre.enum));
	const [isRefreshing, refresh] = useRefresh(HomePage.queries(genres));
	const [imageHeight, setHeight] = useState(300);
	const { scrollHandler, headerProps } = useScrollNavbar({
		imageHeight,
		tab: true,
	});

	return (
		<>
			<HeaderBackground {...headerProps} />
			<Animated.ScrollView
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				refreshControl={
					<RefreshControl
						progressViewOffset={60}
						onRefresh={refresh}
						refreshing={isRefreshing}
					/>
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
							onLayout={(info) => setHeight(info.nativeEvent.layout.height)}
						/>
					)}
					Loader={Header.Loader}
				/>
				<NextupList />
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
				{genres
					.filter((_, i) => i >= 6)
					.map((x) => (
						<GenreGrid key={x} genre={x} />
					))}
			</Animated.ScrollView>
		</>
	);
};

HomePage.queries = (randomItems: Genre[]) => [
	Header.query(),
	NextupList.query(),
	NewsList.query(),
	...randomItems.filter((_, i) => i < 6).map((x) => GenreGrid.query(x)),
	Recommended.query(),
	VerticalRecommended.query(),
];
