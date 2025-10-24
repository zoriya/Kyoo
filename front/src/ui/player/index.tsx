import "react-native-get-random-values";

import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useEvent, useVideoPlayer, VideoView } from "react-native-video";
import { v4 as uuidv4 } from "uuid";
import { useYoshiki } from "yoshiki/native";
import { entryDisplayNumber } from "~/components/entries";
import { FullVideo, type KyooError } from "~/models";
import { ContrastArea, Head } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { useLocalSetting } from "~/providers/settings";
import { type QueryIdentifier, useFetch } from "~/query";
import { Info } from "~/ui/info";
import { useQueryState } from "~/utils";
import { ErrorView } from "../errors";
import { Controls, LoadingIndicator } from "./controls";
import { Back } from "./controls/back";
import { toggleFullscreen } from "./controls/misc";
import { PlayModeContext } from "./controls/tracks-menu";
import { useKeyboard } from "./keyboard";
import { enhanceSubtitles } from "./subtitles";

const clientId = uuidv4();

export const Player = () => {
	const [slug, setSlug] = useQueryState<string>("slug", undefined!);
	const [start, setStart] = useQueryState<number | undefined>("t", undefined);

	const { data, error } = useFetch(Player.query(slug));
	const { data: info, error: infoError } = useFetch(Info.infoQuery(slug));
	// TODO: map current entry using entries' duration & the current playtime
	const currentEntry = 0;
	const entry = data?.entries[currentEntry] ?? data?.entries[0];
	const title = entry
		? entry.kind === "movie"
			? entry.name
			: `${entry.name} (${entryDisplayNumber(entry)})`
		: null;

	const { apiUrl, authToken } = useToken();
	const [defaultPlayMode] = useLocalSetting<"direct" | "hls">(
		"playMode",
		"direct",
	);
	const playModeState = useState(defaultPlayMode);
	const [playMode, setPlayMode] = playModeState;
	const player = useVideoPlayer(
		{
			uri: `${apiUrl}/api/videos/${slug}/${playMode === "direct" ? "direct" : "master.m3u8"}?clientId=${clientId}`,
			// chrome based browsers support matroska but they tell they don't
			mimeType:
				playMode === "direct"
					? info?.mimeCodec?.replace("x-matroska", "mp4")
					: "application/vnd.apple.mpegurl",
			headers: authToken
				? {
						Authorization: `Bearer ${authToken}`,
					}
				: {},
			metadata: {
				title: title ?? undefined,
				artist: data?.show?.name ?? undefined,
				description: entry?.description ?? undefined,
				imageUri: data?.show?.thumbnail?.high ?? undefined,
			},
			externalSubtitles: info?.subtitles
				.filter(
					(x) => Platform.OS === "web" || playMode === "hls" || x.isExternal,
				)
				.map((x) => ({
					// we also add those without link to prevent the order from getting out of sync with `info.subtitles`.
					// since we never actually play those this is fine
					uri:
						x.codec === "subrip" && x.link && Platform.OS === "web"
							? `${x.link}?format=vtt`
							: x.link!,
					label: x.title ?? "Unknown",
					language: x.language ?? "und",
					type: x.codec,
				})),
		},
		(p) => {
			p.playWhenInactive = true;
			p.playInBackground = true;
			p.showNotificationControls = true;
			enhanceSubtitles(p);
			const seek = start ?? data?.progress.time;
			// TODO: fix console.error bellow
			if (seek) p.seekTo(seek);
			else console.error("Player got ready before progress info was loaded.");
			p.play();
		},
	);

	// we'll also want to replace source here once https://github.com/TheWidlarzGroup/react-native-video/issues/4722 is ready
	useEffect(() => {
		if (Platform.OS === "web") player.__ass.fonts = info?.fonts ?? [];
	}, [player, info?.fonts]);

	const router = useRouter();
	const playPrev = useCallback(() => {
		if (!data?.previous) return false;
		setStart(0);
		setSlug(data.previous.video);
		return true;
	}, [data?.previous, setSlug, setStart]);
	const playNext = useCallback(() => {
		if (!data?.next) return false;
		setStart(0);
		setSlug(data.next.video);
		return true;
	}, [data?.next, setSlug, setStart]);

	useEvent(player, "onEnd", () => {
		const hasNext = playNext();
		if (!hasNext && data?.show) router.navigate(data.show.href);
	});

	// TODO: add the equivalent of this for android
	useEffect(() => {
		if (Platform.OS !== "web" || typeof window === "undefined") return;
		window.navigator.mediaSession.setActionHandler(
			"previoustrack",
			data?.previous?.video ? playPrev : null,
		);
		window.navigator.mediaSession.setActionHandler(
			"nexttrack",
			data?.next?.video ? playNext : null,
		);
	}, [data?.next?.video, data?.previous?.video, playNext, playPrev]);

	useKeyboard(player, playPrev, playNext);

	useEffect(() => {
		if (Platform.OS !== "web") return;
		if (/Mobi/i.test(window.navigator.userAgent)) toggleFullscreen(true);
		return () => {
			if (!document.location.href.includes("/watch")) toggleFullscreen(false);
		};
	}, []);

	const [playbackError, setPlaybackError] = useState<KyooError | undefined>();
	useEvent(player, "onError", (error) => {
		if (
			error.code === "source/unsupported-content-type" &&
			playMode === "direct"
		)
			setPlayMode("hls");
		else setPlaybackError({ status: error.code, message: error.message });
	});
	const { css } = useYoshiki();
	if (error || infoError || playbackError) {
		return (
			<>
				<Back
					name={data?.show?.name ?? "Error"}
					{...css({ position: "relative", bg: (theme) => theme.accent })}
				/>
				<ErrorView error={error ?? infoError ?? playbackError!} />
			</>
		);
	}

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: "black",
			}}
		>
			<Head
				title={title}
				description={entry?.description}
				image={data?.show?.thumbnail?.high}
			/>
			<Stack.Screen
				options={{
					headerShown: false,
					navigationBarHidden: true,
					statusBarHidden: true,
					orientation: "landscape",
					contentStyle: { paddingLeft: 0, paddingRight: 0 },
				}}
			/>
			<VideoView
				player={player}
				pictureInPicture
				autoEnterPictureInPicture
				resizeMode={"contain"}
				style={StyleSheet.absoluteFillObject}
			/>
			<ContrastArea mode="dark">
				<LoadingIndicator player={player} />
				<PlayModeContext.Provider value={playModeState}>
					<Controls
						player={player}
						name={data?.show?.name}
						poster={data?.show?.poster}
						subName={
							entry
								? [entryDisplayNumber(entry), entry.name]
										.filter((x) => x)
										.join(" - ")
								: undefined
						}
						chapters={info?.chapters ?? []}
						previous={data?.previous?.video}
						next={data?.next?.video}
					/>
				</PlayModeContext.Provider>
			</ContrastArea>
		</View>
	);
};

Player.query = (slug: string): QueryIdentifier<FullVideo> => ({
	path: ["api", "videos", slug],
	params: {
		with: ["next", "previous", "show"],
	},
	parser: FullVideo,
});
