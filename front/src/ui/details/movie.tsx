import { useRef, useState } from "react";
import type { ScrollView } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryState } from "~/utils";
import { HeaderBackground, useScrollNavbar } from "../navbar";
import { Header } from "./header";
import { Staff } from "./staff";

export const MovieDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const insets = useSafeAreaInsets();
	const [imageHeight, setHeight] = useState(300);
	const { scrollHandler, headerProps } = useScrollNavbar({ imageHeight });
	const scroll = useRef<ScrollView>(null);

	return (
		<>
			<HeaderBackground {...headerProps} />
			<Animated.ScrollView
				ref={scroll}
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				contentContainerStyle={{ paddingBottom: insets.bottom }}
			>
				<Header
					kind="movie"
					slug={slug}
					onImageLayout={(e) => setHeight(e.nativeEvent.layout.height)}
					// the header is the top of the page, so that is where the page belongs
					// once the remote is on it.
					onSelected={() => scroll.current?.scrollTo({ y: 0, animated: false })}
				/>
				<Staff kind="movie" slug={slug} />
			</Animated.ScrollView>
		</>
	);
};
