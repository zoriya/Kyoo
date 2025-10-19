import { Stack, useRouter } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useEvent, useVideoPlayer, VideoView } from "react-native-video";
import { entryDisplayNumber } from "~/components/entries";
import { FullVideo, VideoInfo } from "~/models";
import { ContrastArea, Head } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { useLocalSetting } from "~/providers/settings";
import { type QueryIdentifier, useFetch } from "~/query";
import { useQueryState } from "~/utils";
import { Controls, LoadingIndicator } from "./controls";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toggleFullscreen } from "./controls/misc";
import { Back } from "./controls/back";
import { useYoshiki } from "yoshiki/native";
import { ErrorView } from "../errors";

const clientId = uuidv4();

export const Player = () => {
	const [slug, setSlug] = useQueryState<string>("slug", undefined!);
	const [start, setStart] = useQueryState<number | undefined>("t", undefined);

	const { data, error } = useFetch(Player.query(slug));
	const { data: info, error: infoError } = useFetch(Player.infoQuery(slug));
	// TODO: map current entry using entries' duration & the current playtime
	const currentEntry = 0;
	const entry = data?.entries[currentEntry] ?? data?.entries[0];
	const title = entry ? `${entry.name} (${entryDisplayNumber(entry)})` : null;

	const { apiUrl, authToken } = useToken();
	const [defaultPlayMode] = useLocalSetting<"direct" | "hls">(
		"playMode",
		"direct",
	);
	const [playMode, setPlayMode] = useState(defaultPlayMode);
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
				description: entry?.description ?? undefined,
				artist: data?.show?.name ?? undefined,
				imageUri: data?.show?.thumbnail?.high ?? undefined,
			},
			externalSubtitles: info?.subtitles
				.filter((x) => x.link)
				.map((x) => ({
					uri: x.link!,
					// TODO: translate this `Unknown`
					label: x.title ?? "Unknown",
					language: x.language ?? "und",
					type: x.codec,
				})),
		},
		(p) => {
			p.playWhenInactive = true;
			p.playInBackground = true;
			p.showNotificationControls = true;
			const seek = start ?? data?.progress.time;
			// TODO: fix console.error bellow
			if (seek) p.seekTo(seek);
			else console.error("Player got ready before progress info was loaded.");
			p.play();
		},
	);

	const router = useRouter();
	useEvent(player, "onEnd", () => {
		if (!data) return;
		if (data.next) {
			setStart(0);
			setSlug(data.next.video);
		} else {
			router.navigate(data.show!.href);
		}
	});

	// TODO: add the equivalent of this for android
	useEffect(() => {
		if (typeof window === "undefined") return;
		const prev = data?.previous?.video;
		window.navigator.mediaSession.setActionHandler(
			"previoustrack",
			prev
				? () => {
						setStart(0);
						setSlug(prev);
					}
				: null,
		);
		const next = data?.next?.video;
		window.navigator.mediaSession.setActionHandler(
			"nexttrack",
			next
				? () => {
						setStart(0);
						setSlug(next);
					}
				: null,
		);
	}, [data?.next?.video, data?.previous?.video, setSlug, setStart]);

	// useVideoKeyboard(info?.subtitles, info?.fonts, previous, next);

	// const startTime = startTimeP ?? data?.watchStatus?.watchedTime;

	useEffect(() => {
		if (Platform.OS !== "web") return;
		if (/Mobi/i.test(window.navigator.userAgent)) toggleFullscreen(true);
		return () => {
			if (!document.location.href.includes("/watch")) toggleFullscreen(false);
		};
	}, []);

	const [playbackError, setPlaybackError] = useState<string | undefined>();
	useEvent(player, "onError", (error) => {
		console.log("error", error, "code", error.code, "playbackMode", playMode);
		if (
			error.code === "source/unsupported-content-type" &&
			playMode === "direct"
		)
			setPlayMode("hls");
		else setPlaybackError(error);
	});
	const { css } = useYoshiki();
	if (error || infoError || playbackError) {
		return (
			<>
				<Back
					name={data?.show?.name ?? "Error"}
					{...css({ position: "relative", bg: (theme) => theme.accent })}
				/>
				<ErrorView error={error ?? infoError ?? { errors: [playbackError!] }} />
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

Player.infoQuery = (slug: string): QueryIdentifier<VideoInfo> => ({
	path: ["api", "videos", slug, "info"],
	parser: VideoInfo,
});
