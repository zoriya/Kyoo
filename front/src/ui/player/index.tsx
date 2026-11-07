import { Stack, useRouter } from "expo-router";
import { useIsFocused } from "expo-router/react-navigation";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, View } from "react-native";
import {
	OmniView,
	type Source,
	useEvent,
	usePlayer,
	usePlayerState,
} from "react-native-omni";
import { v4 as uuidv4 } from "uuid";
import { entryDisplayNumber } from "~/components/entries";
import { type QueryIdentifier, useDLE } from "~/data";
import { type Entry, type KyooError, Video, type VideoInfo } from "~/models";
import { Head } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { useLocalSetting } from "~/providers/settings";
import { Info } from "~/ui/info";
import { Remote } from "~/ui/remote";
import { useQueryState } from "~/utils";
import { CastingScreen } from "./casting-screen";
import { Controls, LoadingIndicator } from "./controls";
import { ErrorPopup } from "./controls/error-popup";
import { toggleFullscreen } from "./controls/misc";
import { PlayModeContext } from "./controls/tracks-menu";
import { EntriesMenu } from "./entries-menu";
import { setPlayerSource } from "./imperative";
import { useKeyboard } from "./keyboard";
import { useLanguagePreference } from "./language-preference";
import { usePresign } from "./presign";
import { useProgressObserver } from "./progress-observer";

const clientId = uuidv4();

// btoa only handles latin1, so give it the utf8 bytes instead of the string
const base64UrlPath = (path: string) =>
	btoa(String.fromCharCode(...new TextEncoder().encode(path)))
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replaceAll("=", "");

const withPresign = (url: string, signature: string | null): string => {
	if (!url || !signature) return url;
	return `${url}${url.includes("?") ? "&" : "?"}x-presign=${signature}`;
};

type PlayMode = "direct" | "hls";

export const Player = () => {
	const [slug, setSlug] = useQueryState<string>("slug", undefined!);
	const [startQ, setStartQ] = useQueryState<string | undefined>("t", undefined);
	const [start, setStart] = useState<string | undefined>(startQ);

	useEffect(() => {
		if (startQ === undefined) return;
		setStart(startQ);
		setStartQ(undefined);
	}, [startQ, setStartQ]);

	const { data } = useDLE(Player.query(slug));
	const { data: info } = useDLE(Info.infoQuery(slug));
	// TODO: map current entry using entries' duration & the current playtime
	const currentEntry = 0;
	const entry = data?.entries?.[currentEntry] ?? data?.entries?.[0];
	const title = entry
		? entry.kind === "movie"
			? entry.name
			: `${entryDisplayNumber(entry)} - ${entry.name}`
		: data?.path;

	const { apiUrl, authToken } = useToken();
	const presign = usePresign(
		data
			? {
					for: [
						{ prefix: `/api/videos/${slug}`, verb: "GET" },
						{ url: "/api/ws", verb: "GET" },
						{ prefix: `/video/${base64UrlPath(data.path)}`, verb: "GET" },
						...[data.show?.poster?.id, data.show?.thumbnail?.id]
							.filter((id) => !!id)
							.map((id) => ({ url: `/api/images/${id}`, verb: "GET" })),
					],
					...(entry && { claims: { wsRoutes: [`watch/${entry.id}`] } }),
					duration: "24h",
				}
			: null,
	);
	const [defaultPlayMode] = useLocalSetting<PlayMode>("playMode", "direct");
	const [playMode, setPlayMode] = useState(defaultPlayMode);
	const [playbackError, setPlaybackError] = useState<KyooError | undefined>();

	const player = usePlayer();
	const setAudioPreference = useLanguagePreference(
		info,
		data?.show?.original.language,
	);
	const playModeState = useMemo<
		[PlayMode, (mode: PlayMode, audio?: number) => void]
	>(
		() => [
			playMode,
			(mode, audio) => {
				if (audio !== undefined) setAudioPreference(audio);
				if (mode === playMode) return;
				// changing the mode reloads the video, restart it where we are now
				setStart(Math.round(player.currentTime).toString());
				setPlayMode(mode);
			},
		],
		[playMode, player, setAudioPreference],
	);

	const source = useMemo<Source | undefined>(() => {
		if (!data || !info || presign === undefined) return undefined;
		return {
			src: {
				uri: withPresign(
					`${apiUrl}/api/videos/${slug}/${playMode === "direct" ? "direct" : "master.m3u8"}?clientId=${clientId}`,
					presign,
				),
				// chrome based browsers support matroska but they tell they don't.
				// list ass in the codecs so android's auto backend can pick vlc
				// without opening the media in exoplayer first.
				mimeType:
					playMode === "direct"
						? info.subtitles.some(
								(x) => x.codec === "ass" || x.codec === "ssa",
							) && info.mimeCodec?.endsWith('"')
							? info.mimeCodec
									.replace("x-matroska", "mp4")
									.replace(/"$/, ', ass"')
							: info.mimeCodec?.replace("x-matroska", "mp4")
						: "application/x-mpegURL",
				headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
			},
			startTime: start
				? Number.parseInt(start, 10)
				: data.progress && data.progress.percent >= 95
					? 0
					: data.progress?.time,
			subtitles: info.subtitles
				.map((x, i) => ({ sub: x, id: (x.index ?? i).toString() }))
				.filter(
					({ sub }) =>
						sub.link &&
						(Platform.OS === "web" || playMode === "hls" || sub.isExternal),
				)
				.map(({ sub, id }) => ({
					id,
					link: withPresign(
						`${apiUrl}${sub.codec === "subrip" && Platform.OS === "web" ? `${sub.link}?format=vtt` : sub.link!}`,
						presign,
					),
					label: sub.title ?? "Unknown",
					language: sub.language ?? "und",
				})),
			fonts: info.fonts.map((x) => withPresign(`${apiUrl}${x}`, presign)),
			metadata: {
				title: title ?? data.path,
				artist: data.show?.name ?? undefined,
				imageLink: data.show?.thumbnail
					? withPresign(`${apiUrl}${data.show.thumbnail.high}`, presign)
					: undefined,
				hasPrev: !!data.previous?.video,
				hasNext: !!data.next?.video,
			},
			castId: `${apiUrl}/api/videos/${slug}`,
			castData: {
				apiUrl,
				slug,
				clientId,
				...(presign && { presign }),
				// an android tv plays casts with the caster's account. not sent by the
				// tv itself, it reports its castData to every sender.
				...(authToken && !Platform.isTV && { token: authToken }),
				title: title ?? data.path,
				...(data.show?.name && { subtitle: data.show.name }),
				...(data.show?.poster?.id && {
					poster: `${apiUrl}/api/images/${data.show.poster.id}?quality=high${
						presign ? `&x-presign=${presign}` : ""
					}`,
				}),
			},
		};
	}, [apiUrl, slug, playMode, info, authToken, start, data, title, presign]);
	useEffect(() => {
		if (
			Platform.OS !== "web" &&
			(player.castStatus === "connected" ||
				player.castStatus === "connecting") &&
			(!source || player.source?.castId === source.castId)
		) {
			// do not re-set the source when casting the correct content,
			// it would restart playback
			return;
		}
		setPlayerSource(player, source);
	}, [source, player]);

	// When leaving the watch screen, unload the player unless it is casting (the
	// mini-player then keeps driving the receiver).
	const castStatus = usePlayerState("castStatus");
	const unloadUnlessCasting = useEffectEvent(() => {
		const isCasting = castStatus === "connected" || castStatus === "connecting";
		if (!isCasting) setPlayerSource(player, undefined);
	});
	useEffect(() => {
		return () => unloadUnlessCasting();
	}, []);

	// The mini-player cannot stop a cast on its own (the media tech only lives
	// on this screen), so it navigates here with `?stopCast`. Once the tech is
	// live again (cast reconnected), tear the cast down and clear the flag.
	const [stopCast, setStopCast] = useQueryState<string | undefined>(
		"stopCast",
		undefined,
	);
	useEffect(() => {
		if (!stopCast || castStatus !== "connected") return;
		player.toggleCastStatus();
		setStopCast(undefined);
	}, [stopCast, castStatus, player, setStopCast]);

	const router = useRouter();
	const { t } = useTranslation();
	const isFocused = useIsFocused();

	const onEnd = () => {
		if (data?.next) {
			player.playNext();
			return;
		}
		setPlayerSource(player, undefined);
		if (data?.show?.href) router.replace(data.show.href);
	};

	useProgressObserver(
		data && entry
			? { videoId: data.id, entryId: entry.id, kind: entry.kind }
			: null,
	);

	useEvent("end", onEnd);
	useEvent("prev", () => {
		if (!isFocused || !data?.previous) return;
		if (!data.previous.video) {
			setPlaybackError({
				status: "not-available",
				message: t("player.not-available", {
					entry: `${entryDisplayNumber(data.previous.entry)} ${data.previous.entry.name}`,
				}),
			});
			return;
		}
		setPlaybackError(undefined);
		setStart("0");
		setSlug(data.previous.video);
	});
	useEvent("next", () => {
		if (!isFocused || !data?.next) return;
		if (!data.next.video) {
			setPlaybackError({
				status: "not-available",
				message: t("player.not-available", {
					entry: `${entryDisplayNumber(data.next.entry)} ${data.next.entry.name}`,
				}),
			});
			return;
		}
		setPlaybackError(undefined);
		setStart("0");
		setSlug(data.next.video);
	});

	const remote =
		Platform.OS !== "web" &&
		(castStatus === "connected" || castStatus === "connecting");

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
					navigationBarHidden: !remote,
					statusBarHidden: !remote,
					orientation: remote ? "default" : "landscape",
					contentStyle: { paddingLeft: 0, paddingRight: 0 },
				}}
			/>
			{remote ? (
				<Remote
					showHref={data?.show?.href}
					name={data?.show?.name ?? data?.path}
					poster={data ? (data.show?.poster ?? null) : undefined}
					subName={
						entry
							? [entryDisplayNumber(entry), entry.name]
									.filter((x) => x)
									.join(" - ")
							: data?.path
					}
					chapters={info?.chapters ?? []}
					hasPrev={!!data?.previous}
					hasNext={!!data?.next}
					seekEnd={onEnd}
				/>
			) : (
				<PlayModeContext.Provider value={playModeState}>
					<PlayerContent
						data={data}
						info={info}
						entry={entry}
						playMode={playMode}
						setPlayMode={playModeState[1]}
						setStart={setStart}
						playbackError={playbackError}
						setPlaybackError={setPlaybackError}
						seekEnd={onEnd}
					/>
				</PlayModeContext.Provider>
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

const PlayerContent = ({
	data,
	info,
	entry,
	playMode,
	setPlayMode,
	setStart,
	playbackError,
	setPlaybackError,
	seekEnd,
}: {
	data?: Video;
	info?: VideoInfo;
	entry?: Entry;
	playMode: PlayMode;
	setPlayMode: (mode: PlayMode) => void;
	setStart: (start: string | undefined) => void;
	playbackError?: KyooError;
	setPlaybackError: (error: KyooError | undefined) => void;
	seekEnd: () => void;
}) => {
	const [entriesMenuOpen, setEntriesMenuOpen] = useState(false);

	useKeyboard();

	useEffect(() => {
		if (Platform.OS !== "web") return;
		if (/Mobi/i.test(window.navigator.userAgent)) toggleFullscreen(true);
		return () => {
			if (!document.location.href.includes("/watch")) toggleFullscreen(false);
		};
	}, []);

	useEvent("error", (type: string, message: string) => {
		if (type === "source/unsupported-content-type" && playMode === "direct")
			setPlayMode("hls");
		else setPlaybackError({ status: type, message });
	});

	return (
		<>
			<OmniView
				autoplay
				autoPip
				style={StyleSheet.absoluteFill}
				subtitleAssets={{
					jassub: {
						workerUrl: "/jassub/jassub-worker.js",
						wasmUrl: "/jassub/jassub-worker.wasm",
						modernWasmUrl: "/jassub/jassub-worker-modern.wasm",
						fontUrl: "/jassub/default.woff2",
					},
					pgs: { workerUrl: "/libpgs/libpgs.worker.js" },
				}}
			/>
			<CastingScreen name={data?.show?.name ?? data?.path} />
			<LoadingIndicator />
			<Controls
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
				hasPrev={!!data?.previous}
				hasNext={!!data?.next}
				seekEnd={seekEnd}
				onOpenEntriesMenu={
					data?.show?.kind === "serie"
						? () => setEntriesMenuOpen(true)
						: undefined
				}
				forceShow={!!playbackError || entriesMenuOpen}
			/>
			{data?.show?.kind === "serie" && (
				<EntriesMenu
					isOpen={entriesMenuOpen}
					onClose={() => setEntriesMenuOpen(false)}
					showSlug={data.show.slug}
					season={entry?.kind === "episode" ? entry.seasonNumber : 0}
					currentEntrySlug={entry?.slug}
					setStart={setStart}
				/>
			)}
		</>
	);
};

Player.query = (slug: string): QueryIdentifier<Video> => ({
	path: ["api", "videos", slug],
	params: {
		with: ["next", "previous", "show"],
	},
	schema: Video,
});
