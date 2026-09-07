import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryState } from "~/utils";
import { useHeroHeight } from "../hero";
import { HeaderBackground, useScrollNavbar } from "../navbar";
import { Header } from "./header";
import { Staff } from "./staff";

export const MovieDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const insets = useSafeAreaInsets();
	const { scrollHandler, headerProps } = useScrollNavbar({
		imageHeight: useHeroHeight(),
	});

	return (
		<>
			<HeaderBackground {...headerProps} />
			<Animated.ScrollView
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				contentContainerStyle={{ paddingBottom: insets.bottom }}
			>
				<Header kind="movie" slug={slug} />
				<Staff kind="movie" slug={slug} />
			</Animated.ScrollView>
		</>
	);
};
