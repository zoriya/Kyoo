import { type ComponentProps, useDeferredValue, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, type ViewProps } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Path } from "react-native-svg";
import { EntryLine, entryDisplayNumber } from "~/components/entries";
import {
	EntrySelect,
	type EntrySelectEntry,
} from "~/components/entries/select";
import type { Entry, Serie } from "~/models";
import { Container, H2, Svg } from "~/primitives";
import { Fetch } from "~/query";
import { SearchBar } from "~/ui/navbar";
import { useQueryState } from "~/utils";
import { HeaderBackground, useScrollNavbar } from "../navbar";
import { Header } from "./header";
import { EntryList } from "./season";
import { Staff } from "./staff";

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

export const NextUp = ({
	entry,
	onSelectVideos,
}: {
	entry: Entry;
	onSelectVideos?: (entry: {
		displayNumber: string;
		name: string | null;
		videos: Entry["videos"];
	}) => void;
}) => {
	const { t } = useTranslation();
	const displayNumber = entryDisplayNumber(entry);

	return (
		<View className="m-4 flex-1">
			<Container className="overflow-hidden rounded-2xl bg-card py-4">
				<H2 className="mb-4 ml-2">{t("show.nextUp")}</H2>
				<EntryLine
					{...entry}
					serieSlug={null}
					videos={entry.videos}
					watchedPercent={entry.progress.percent}
					displayNumber={displayNumber}
					onSelectVideos={() =>
						onSelectVideos?.({
							displayNumber,
							name: entry.name,
							videos: entry.videos,
						})
					}
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
	onSelectVideos,
}: {
	slug: string;
	onImageLayout?: ViewProps["onLayout"];
	onSelectVideos?: (entry: {
		displayNumber: string;
		name: string | null;
		videos: Entry["videos"];
	}) => void;
}) => {
	const [_, setSearch] = useQueryState("search", "");
	// Defer the cast grid & next-up block to a low-priority render: the hero
	// commits (and paints) first, then the below-the-fold subtree mounts,
	// instead of everything landing in the same synchronous commit.
	const belowFold = useDeferredValue(true, false);

	return (
		<View className="bg-background">
			<Header kind="serie" slug={slug} onImageLayout={onImageLayout} />
			{belowFold && (
				<>
					<Fetch
						// Use the same fetch query as header
						query={Header.query("serie", slug)}
						Render={(serie) => {
							const nextEntry = (serie as Serie).nextEntry;
							return nextEntry ? (
								<NextUp entry={nextEntry} onSelectVideos={onSelectVideos} />
							) : null;
						}}
						Loader={NextUp.Loader}
					/>
					<Staff kind="serie" slug={slug} />
				</>
			)}
			<SvgWave className="flex-1 shrink-0 fill-card" />
			<View className="bg-card pb-4 pl-[10%]">
				<View className="-mt-4 lg:-mt-12 xl:-mt-24">
					<SearchBar
						onChangeText={(q) => setSearch(q)}
						forceExpand
						containerClassName="w-2/5 max-w-90"
					/>
				</View>
			</View>
		</View>
	);
};

export const SerieDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const [season] = useQueryState("season", undefined!);
	const [search] = useQueryState("search", "");
	const insets = useSafeAreaInsets();
	// Shared value instead of state: the hero's first `onLayout` writes straight
	// to the UI thread, so it no longer triggers a React re-render at all.
	const imageHeight = useSharedValue(300);
	const { scrollHandler, headerProps, headerHeight } = useScrollNavbar({
		imageHeight,
	});
	const [selected, setSelected] = useState<EntrySelectEntry | null>(null);

	return (
		<View className="flex-1 bg-card">
			<HeaderBackground {...headerProps} />
			<EntryList
				slug={slug}
				season={season}
				search={search}
				onSelectVideos={setSelected}
				Header={() => (
					<SerieHeader
						slug={slug}
						onSelectVideos={setSelected}
						onImageLayout={(e) => {
							imageHeight.value = e.nativeEvent.layout.height;
						}}
					/>
				)}
				contentContainerStyle={{ paddingBottom: insets.bottom }}
				withContainer
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				stickyHeaderConfig={{ offset: headerHeight }}
			/>
			<EntrySelect entry={selected} onClose={() => setSelected(null)} />
		</View>
	);
};
