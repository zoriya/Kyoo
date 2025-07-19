import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useVideoPlayer, VideoView } from "react-native-video";
import { entryDisplayNumber } from "~/components/entries";
import { FullVideo, VideoInfo } from "~/models";
import { Head } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { useLocalSetting } from "~/providers/settings";
import { type QueryIdentifier, useFetch } from "~/query";
import { useQueryState } from "~/utils";

// import { Hover, LoadingIndicator } from "./components/hover";
// import { useVideoKeyboard } from "./keyboard";
// import { durationAtom, fullscreenAtom, Video } from "./state";

const mapMetadata = (item: FullVideo | undefined) => {
	if (!item) return null;

	// TODO: map current entry using entries' duration & the current playtime
	const currentEntry = 0;
	const entry = item.entries[currentEntry] ?? item.entries[0];
	if (!entry) return null;

	return {
		currentEntry,
		title: `${entry.name} (${entryDisplayNumber(entry)})`,
		description: entry.description,
		subtitle: item.show!.kind !== "movie" ? item.show!.name : null,
		poster: item.show!.poster,
		thumbnail: item.show!.thumbnail,
	};
};

export const Player = () => {
	const [slug] = useQueryState("slug", undefined!);

	const { apiUrl, authToken } = useToken();
	const [playMode] = useLocalSetting<"direct" | "hls">("playMode", "direct");
	const player = useVideoPlayer({
		uri: `${apiUrl}/api/videos/${slug}/${playMode === "direct" ? "direct" : "master.m3u8"}`,
		headers: {
			Authorization: `Bearer ${authToken}`,
		},
	});

	const { data, error } = useFetch(Player.query(slug));
	const { data: info, error: infoError } = useFetch(Player.infoQuery(slug));
	const metadata = mapMetadata(data);

	// const [playbackError, setPlaybackError] = useState<string | undefined>(
	// 	undefined,
	// );
	// useVideoKeyboard(info?.subtitles, info?.fonts, previous, next);

	// const startTime = startTimeP ?? data?.watchStatus?.watchedTime;

	// const setFullscreen = useSetAtom(fullscreenAtom);
	// useEffect(() => {
	// 	if (Platform.OS !== "web") return;
	// 	if (/Mobi/i.test(window.navigator.userAgent)) setFullscreen(true);
	// 	return () => {
	// 		if (!document.location.href.includes("/watch")) setFullscreen(false);
	// 	};
	// }, [setFullscreen]);

	// if (error || infoError || playbackError)
	// 	return (
	// 		<>
	// 			<Back
	// 				isLoading={false}
	// 				{...css({ position: "relative", bg: (theme) => theme.accent })}
	// 			/>
	// 			<ErrorView error={error ?? infoError ?? { errors: [playbackError!] }} />
	// 		</>
	// 	);

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: "black",
			}}
		>
			<Head
				title={metadata?.title}
				description={metadata?.description}
				image={metadata?.thumbnail?.high}
			/>
			<Stack.Screen
				options={{
					// TODO: find a way to force fullscreen on mobile
					headerTransparent: true,
					headerStyle: { backgroundColor: undefined },
				}}
			/>
			<VideoView
				player={player}
				pictureInPicture={true}
				autoEnterPictureInPicture={true}
				resizeMode={"contain"}
				style={StyleSheet.absoluteFillObject}
			/>
			{/* <LoadingIndicator /> */}
			{/* <Hover {...mapData(data, info, previous, next)} url={`${type}/${slug}`} /> */}
		</View>
	);
};

Player.query = (slug: string): QueryIdentifier<FullVideo> => ({
	path: ["api", "videos", slug],
	params: {
		fields: ["next", "previous", "show"],
	},
	parser: FullVideo,
});

Player.infoQuery = (slug: string): QueryIdentifier<VideoInfo> => ({
	path: ["api", "videos", slug, "info"],
	parser: VideoInfo,
});
