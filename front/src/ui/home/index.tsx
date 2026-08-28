import {
	LegendList,
	type LegendListComponent,
	type LegendListRef,
} from "@legendapp/list/react-native";
import { type ReactElement, useMemo, useRef } from "react";
import { createAnimatedComponent } from "react-native-reanimated";
import { Genre } from "~/models";
import { Fetch, useRefresh } from "~/query";
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
	const [isRefreshing, refresh] = useRefresh(HomePage.queries(genres));
	// The hero height is deterministic from the viewport, so the list can just ask
	// for it instead of measuring it — that avoids the onLayout -> setState that
	// used to reflow the whole list at first paint.
	const imageHeight = useHeroHeight();
	const list = useRef<LegendListRef>(null);
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
				// The rows below fill in one after the other and each one changes size as
				// its images arrive. Legend List keeps the content that is on screen where
				// it is while that happens, which for a first paint means walking the list
				// down until the hero is off the top of the screen — and the play button
				// that should have taken the focus goes with it.
				maintainVisibleContentPosition={false}
				ref={list}
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
				// see fetch-infinite: the scroll view itself must not be a focus target
				focusable={false}
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
								// the hero is the top of the list, so that is where the list
								// belongs once the remote is on it — asking for the focus from
								// the header makes the list scroll to reveal it, and it stops
								// as soon as the button is on screen rather than at the top.
								onSelected={() =>
									list.current?.scrollToOffset({ offset: 0, animated: false })
								}
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
