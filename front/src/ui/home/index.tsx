import {
	LegendList,
	type LegendListComponent,
} from "@legendapp/list/react-native";
import { type ReactElement, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { createAnimatedComponent } from "react-native-reanimated";
import { Genre } from "~/models";
import { uiScale, useBreakpointValue } from "~/primitives";
import { Fetch, useRefresh } from "~/query";
import { shuffle } from "~/utils";
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
	const [isRefreshing, refresh] = useRefresh(HomePage.queries(genres));
	// The hero height is deterministic from the viewport, so mirror its
	// responsive classes here instead of measuring it — that avoids the
	// onLayout -> setState that used to reflow the whole list at first paint.
	// Keep in sync with header.tsx:
	//   h-[40vh] sm:h-[60vh] sm:min-h-187.5 md:min-h-170 lg:h-[65vh]
	const { height } = useWindowDimensions();
	const heroVh = useBreakpointValue({ xs: 0.4, sm: 0.6, lg: 0.65 });
	const heroMinH = useBreakpointValue({ xs: 1, sm: 750, md: 680 }) * uiScale;
	const imageHeight = Math.max(Math.round(height * heroVh), heroMinH);
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
				onRefresh={refresh}
				refreshing={isRefreshing}
				progressViewOffset={60}
				ListHeaderComponent={
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

HomePage.queries = (randomItems: Genre[]) => [
	Header.query(),
	NextupList.query(),
	NewsList.query(),
	...randomItems.filter((_, i) => i < 6).map((x) => GenreGrid.query(x)),
	Recommended.query(),
	VerticalRecommended.query(),
];
