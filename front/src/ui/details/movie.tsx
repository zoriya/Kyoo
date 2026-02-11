import { useState } from "react";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryState } from "~/utils";
import { useScrollNavbar } from "../navbar";
import { Header } from "./header";

export const MovieDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const insets = useSafeAreaInsets();
	const [imageHeight, setHeight] = useState(300);
	const { scrollHandler, headerProps } = useScrollNavbar({ imageHeight });

	return (
		<>
			<Animated.View {...headerProps} />
			<Animated.ScrollView
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				contentContainerStyle={{ paddingBottom: insets.bottom }}
			>
				<Header
					kind="movie"
					slug={slug}
					onImageLayout={(e) => setHeight(e.nativeEvent.layout.height)}
				/>
			</Animated.ScrollView>
		</>
	);
};
