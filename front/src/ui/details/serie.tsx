import { useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Path } from "react-native-svg";
import { EntryLine, entryDisplayNumber } from "~/components/entries";
import type { Entry, Serie } from "~/models";
import { Container, H2, Svg } from "~/primitives";
import { Fetch } from "~/query";
import { useQueryState } from "~/utils";
import { Header } from "./header";
import { EntryList } from "./season";
import { useScrollNavbar } from "../navbar";
import Animated from "react-native-reanimated";
import { ViewProps } from "react-native";

export const SvgWave = (props: ComponentProps<typeof Svg>) => {
	// aspect-[width/height]: width/height of the svg
	return (
		<View className="ml-[-10px] aspect-612/52 w-[110%]">
			<Svg width="100%" height="100%" viewBox="0 372.979 612 52.771" {...props}>
				<Path d="M0,375.175c68,-5.1,136,-0.85,204,7.948c68,9.052,136,22.652,204,24.777s136,-8.075,170,-12.878l34,-4.973v35.7h-612" />
			</Svg>
		</View>
	);
};

export const NextUp = (nextEntry: Entry) => {
	const { t } = useTranslation();

	return (
		<View className="m-4 flex-1">
			<Container className="overflow-hidden rounded-2xl bg-card py-4">
				<H2 className="mb-4 ml-2">{t("show.nextUp")}</H2>
				<EntryLine
					{...nextEntry}
					serieSlug={null}
					videosCount={nextEntry.videos.length}
					watchedPercent={nextEntry.progress.percent}
					displayNumber={entryDisplayNumber(nextEntry)}
				/>
			</Container>
		</View>
	);
};

NextUp.Loader = () => {
	const { t } = useTranslation();

	return (
		<View className="m-4 flex-1">
			<Container className="overflow-hidden rounded-2xl bg-card py-4">
				<H2 className="ml-4">{t("show.nextUp")}</H2>
				<EntryLine.Loader />
			</Container>
		</View>
	);
};

const SerieHeader = ({
	slug,
	onImageLayout,
}: {
	slug: string;
	onImageLayout?: ViewProps["onLayout"];
}) => {
	return (
		<View className="bg-background">
			<Header kind="serie" slug={slug} onImageLayout={onImageLayout} />
			<Fetch
				// Use the same fetch query as header
				query={Header.query("serie", slug)}
				Render={(serie) => {
					const nextEntry = (serie as Serie).nextEntry;
					return nextEntry ? <NextUp {...nextEntry} /> : null;
				}}
				Loader={NextUp.Loader}
			/>
			{/* <DetailsCollections type="serie" slug={slug} /> */}
			{/* <Staff slug={slug} /> */}
			<SvgWave className="flex-1 shrink-0 fill-card" />
		</View>
	);
};

export const SerieDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const [season] = useQueryState("season", undefined!);
	const insets = useSafeAreaInsets();
	const [imageHeight, setHeight] = useState(300);
	const { scrollHandler, headerProps, headerHeight } = useScrollNavbar({
		imageHeight,
	});

	return (
		<View className="flex-1 bg-card">
			<Animated.View {...headerProps} />
			<EntryList
				slug={slug}
				season={season}
				Header={() => (
					<SerieHeader
						slug={slug}
						onImageLayout={(e) => setHeight(e.nativeEvent.layout.height)}
					/>
				)}
				contentContainerStyle={{ paddingBottom: insets.bottom }}
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				stickyHeaderConfig={{
					offset: headerHeight,
					backdropComponent: () => (
						// hr bottom margin is m-4 and layout gap is 2 but it's only applied on the web and idk why
						<View className="absolute inset-0 mb-4 web:mb-6 bg-card" />
					),
				}}
			/>
		</View>
	);
};
