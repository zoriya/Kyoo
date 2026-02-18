import { useState } from "react";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryState } from "~/utils";
import { HeaderBackground, useScrollNavbar } from "../navbar";
import { Header } from "./header";

export const CollectionDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const insets = useSafeAreaInsets();
	const [imageHeight, setHeight] = useState(300);
	const { scrollHandler, headerProps } = useScrollNavbar({ imageHeight });

	return (
		<>
			<HeaderBackground {...headerProps} />
			<Animated.ScrollView
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				contentContainerStyle={{ paddingBottom: insets.bottom }}
			>
				<Header
					kind="collection"
					slug={slug}
					onImageLayout={(e) => setHeight(e.nativeEvent.layout.height)}
				/>
			</Animated.ScrollView>
		</>
	);
};
