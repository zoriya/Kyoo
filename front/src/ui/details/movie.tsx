import { useState } from "react";
import { Platform } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Container, FocusGroup } from "~/primitives";
import { useQueryState } from "~/utils";
import { useHeroHeight } from "../hero";
import { HeaderBackground, useScrollNavbar } from "../navbar";
import { Header } from "./header";
import { InfoShelf } from "./shelf";
import { Staff } from "./staff";

export const MovieDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const insets = useSafeAreaInsets();
	const { scrollHandler, headerProps } = useScrollNavbar({
		imageHeight: useHeroHeight(),
	});
	const [info, setInfo] = useState(false);

	return (
		<>
			<HeaderBackground {...headerProps} />
			<FocusGroup autoFocus focusable={!info} className="flex-1">
				<Animated.ScrollView
					onScroll={scrollHandler}
					scrollEventThrottle={16}
					snapToAlignment="item"
					contentContainerStyle={{ paddingBottom: insets.bottom }}
				>
					<Header
						kind="movie"
						slug={slug}
						openInfo={Platform.isTV ? () => setInfo(true) : undefined}
					/>
					{!Platform.isTV && (
						<Container className="mb-4">
							<Staff kind="movie" slug={slug} layout={Staff.layout} />
						</Container>
					)}
				</Animated.ScrollView>
			</FocusGroup>
			{Platform.isTV && (
				<InfoShelf
					kind="movie"
					slug={slug}
					isOpen={info}
					close={() => setInfo(false)}
				/>
			)}
		</>
	);
};
