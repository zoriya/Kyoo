import {
	LegendList,
	type LegendListComponent,
} from "@legendapp/list/react-native";
import { type ReactElement, useMemo, useState } from "react";
import { View } from "react-native";
import { createAnimatedComponent } from "react-native-reanimated";
import { Genre } from "~/models";
import { useDbClient } from "@tanstack/react-db";
import { refetchAll } from "~/db";
import { useRefresh } from "~/query";
import { shuffle } from "~/utils";
import { useHeroHeight } from "../hero";
import { HeaderBackground, useScrollNavbar } from "../navbar";
import { GenreGrid } from "./genre";
import { Header } from "./header";
import { NewsList } from "./news";
import { NextupList } from "./nextup";
import { Recommended } from "./recommended";
import { VerticalRecommended } from "./vertical";

const AnimatedLegendList = createAnimatedComponent(
	LegendList,
) as LegendListComponent;

export const HomePage = () => {
	const genres = useMemo(() => shuffle(Object.values(Genre.enum)), []);
	const client = useDbClient();
	const [isRefreshingHeader, refreshHeader] = useRefresh([Header.query()]);
	const [isRefreshingDb, setRefreshingDb] = useState(false);
	const isRefreshing = isRefreshingHeader || isRefreshingDb;
	const refresh = async () => {
		setRefreshingDb(true);
		try {
			await Promise.all([refreshHeader(), refetchAll(client)]);
		} finally {
			setRefreshingDb(false);
		}
	};
	const imageHeight = useHeroHeight();
	const { scrollHandler, headerProps } = useScrollNavbar({
		imageHeight,
		tab: true,
	});

	return (
		<>
			<HeaderBackground {...headerProps} />
			<AnimatedLegendList
				estimatedItemSize={340}
				estimatedHeaderSize={imageHeight}
				drawDistance={600}
				snapToAlignment="item"
				getItemType={(el: ReactElement) => {
					switch (el.type) {
						case GenreGrid:
							return "genre";
						case Recommended:
							return "recommended";
						case VerticalRecommended:
							return "vertical";
						case NextupList:
							return "nextup";
						case NewsList:
							return "news";
						default:
							console.error("unhandled item type in home screen", el);
							return "other";
					}
				}}
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				focusable={false}
				onRefresh={refresh}
				refreshing={isRefreshing}
				progressViewOffset={60}
				ListHeaderComponent={
					<View scrollSnapAlign="start">
						<Header />
					</View>
				}
			>
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
			</AnimatedLegendList>
		</>
	);
};
