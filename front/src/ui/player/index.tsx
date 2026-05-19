import "react-native-get-random-values";

import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, View } from "react-native";
import { useEvent, useVideoPlayer, VideoView } from "react-native-video";
import { v4 as uuidv4 } from "uuid";
import { entryDisplayNumber } from "~/components/entries";
import { FullVideo, type KyooError } from "~/models";
import { Head } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { useLocalSetting } from "~/providers/settings";
import { type QueryIdentifier, useFetch } from "~/query";
import { Info } from "~/ui/info";
import { useQueryState } from "~/utils";
import { Controls, LoadingIndicator } from "./controls";
import { ErrorPopup } from "./controls/error-popup";
import { toggleFullscreen } from "./controls/misc";
import { PlayModeContext } from "./controls/tracks-menu";
import { EntriesMenu } from "./entries-menu";
import { useKeyboard } from "./keyboard";
import { useLanguagePreference } from "./language-preference";
import { useProgressObserver } from "./progress-observer";
import { enhanceSubtitles } from "./subtitles";

const clientId = uuidv4();

export const Player = () => {
	const [slug, setSlug] = useQueryState<string>("slug", undefined!);
	const [start, setStart] = useQueryState<string | undefined>("t", undefined);

	const { data } = useFetch(Player.query(slug));
	const { data: info } = useFetch(Info.infoQuery(slug));
	// TODO: map current entry using entries' duration & the current playtime
	const currentEntry = 0;
	const entry = data?.entries[currentEntry] ?? data?.entries[0];
	const title = entry
		? entry.kind === "movie"
			? entry.name
			: `${entry.name} (${entryDisplayNumber(entry)})`
		: data?.path;

	const { apiUrl, authToken } = useToken();
	const [defaultPlayMode] = useLocalSetting<"direct" | "hls">(
		"playMode",
		"direct",
	);
	const playModeState = useState(defaultPlayMode);
	const [playMode, setPlayMode] = playModeState;
	const [playbackError, setPlaybackError] = useState<KyooError | undefined>();
	const [entriesMenuOpen, setEntriesMenuOpen] = useState(false);
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
			const seek = start ? Number.parseInt(start, 10) : data?.progress.time;
			// TODO: fix console.error bellow
			if (seek) p.seekTo(seek);
			else console.error("Player got ready before progress info was loaded.");
			p.play();
		},
	);

	// we'll also want to replace source here once https://github.com/TheWidlarzGroup/react-native-video/issues/4722 is ready
	useEffect(() => {
		if (Platform.OS !== "web") return;
		enhanceSubtitles(player);
		player.__ass.fonts = info?.fonts ?? [];
	}, [player, info?.fonts]);

	const router = useRouter();
	const { t } = useTranslation();
	const playPrev = useCallback(() => {
		if (!data?.previous) return false;
		if (!data.previous.video) {
			setPlaybackError({
				status: "not-available",
				message: t("player.not-available", {
					entry: `${entryDisplayNumber(data.previous.entry)} ${data.previous.entry.name}`,
				}),
			});
			return true;
		}
		setPlaybackError(undefined);
		setStart("0");
		setSlug(data.previous.video);
		return true;
	}, [data?.previous, setSlug, setStart, t]);
	const playNext = useCallback(() => {
		if (!data?.next) return false;
		if (!data.next.video) {
			setPlaybackError({
				status: "not-available",
				message: t("player.not-available", {
					entry: `${entryDisplayNumber(data.next.entry)} ${data.next.entry.name}`,
				}),
			});
			return true;
		}
		setPlaybackError(undefined);
		setStart("0");
		setSlug(data.next.video);
		return true;
	}, [data?.next, setSlug, setStart, t]);
	const onEnd = useCallback(() => {
		const hasNext = playNext();
		if (!hasNext && data?.show?.href) router.replace(data.show.href);
	}, [data?.show?.href, playNext, router]);

	useProgressObserver(
		player,
		data && entry ? { videoId: data.id, entryId: entry.id } : null,
	);
	useLanguagePreference(player, slug);

	useEvent(player, "onEnd", onEnd);

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

	useEvent(player, "onError", (error) => {
		if (
			error.code === "source/unsupported-content-type" &&
			playMode === "direct"
		)
			setPlayMode("hls");
		else setPlaybackError({ status: error.code, message: error.message });
	});

	return (
		<View className="flex-1 bg-black">
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
				style={StyleSheet.absoluteFill}
			/>
			<LoadingIndicator player={player} />
			<PlayModeContext.Provider value={playModeState}>
				<Controls
					player={player}
					showHref={data?.show?.href}
					name={data?.show?.name ?? data?.path}
					poster={data ? (data.show?.poster ?? null) : undefined}
					showKind={data?.show?.kind}
					showLogo={data?.show?.logo ?? null}
					subName={
						entry
							? [entryDisplayNumber(entry), entry.name]
									.filter((x) => x)
									.join(" - ")
							: data?.path
					}
					chapters={info?.chapters ?? []}
					playPrev={data?.previous ? playPrev : null}
					playNext={data?.next ? playNext : null}
					seekEnd={onEnd}
					onOpenEntriesMenu={
						data?.show?.kind === "serie"
							? () => setEntriesMenuOpen(true)
							: undefined
					}
					forceShow={!!playbackError}
				/>
			</PlayModeContext.Provider>
			{data?.show?.kind === "serie" && (
				<EntriesMenu
					isOpen={entriesMenuOpen}
					onClose={() => setEntriesMenuOpen(false)}
					showSlug={data.show.slug}
					season={entry?.kind === "episode" ? entry.seasonNumber : 0}
					currentEntrySlug={entry?.slug}
				/>
			)}
			{playbackError && (
				<ErrorPopup
					message={playbackError.message}
					dismiss={() => setPlaybackError(undefined)}
				/>
			)}
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
