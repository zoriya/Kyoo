import "react-native-get-random-values";

import { Stack, useRouter } from "expo-router";
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
import { z } from "zod/v4";
import { entryDisplayNumber } from "~/components/entries";
import { FullVideo, type KyooError, type VideoInfo } from "~/models";
import { Head } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { useLocalSetting } from "~/providers/settings";
import { type QueryIdentifier, useFetch } from "~/query";
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
import { useProgressObserver } from "./progress-observer";

const clientId = uuidv4();

const CastPresign = z.object({ signature: z.string() });

const base64UrlPath = (path: string): string =>
	typeof window !== "undefined" && window.btoa
		? window
				.btoa(path)
				.replace(/\+/g, "-")
				.replace(/\//g, "_")
				.replace(/=+$/, "")
		: Buffer.from(path).toString("base64url");

const withPresign = (url: string, signature?: string): string => {
	if (!url || !signature) return url;
	return `${url}${url.includes("?") ? "&" : "?"}x-presign=${signature}`;
};

type PlayMode = "direct" | "hls";

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
			: `${entryDisplayNumber(entry)} - ${entry.name}`
		: data?.path;

	const { apiUrl, authToken } = useToken();
	const { data: presign } = useFetch(
		Player.presignQuery(
			slug,
			authToken ? data?.path : undefined,
			[data?.show?.poster?.id, data?.show?.thumbnail?.id],
			entry?.id,
		),
	);
	const [defaultPlayMode] = useLocalSetting<PlayMode>("playMode", "direct");
	const [playMode, setPlayMode] = useState(defaultPlayMode);
	const [playbackError, setPlaybackError] = useState<KyooError | undefined>();

	const player = usePlayer();
	const playModeState = useMemo<[PlayMode, (mode: PlayMode) => void]>(
		() => [
			playMode,
			(mode) => {
				// changing the mode reloads the video, restart it where we are now
				setStart(Math.round(player.currentTime).toString());
				setPlayMode(mode);
			},
		],
		[playMode, player, setStart],
	);

	const source = useMemo<Source>(
		() => ({
			src: {
				uri: withPresign(
					`${apiUrl}/api/videos/${slug}/${playMode === "direct" ? "direct" : "master.m3u8"}?clientId=${clientId}`,
					presign?.signature,
				),
				// chrome based browsers support matroska but they tell they don't
				mimeType:
					playMode === "direct"
						? info?.mimeCodec?.replace("x-matroska", "mp4")
						: "application/x-mpegURL",
				headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
			},
			startTime: start ? Number.parseInt(start, 10) : data?.progress.time,
			subtitles: (info?.subtitles ?? [])
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
						presign?.signature,
					),
					label: sub.title ?? "Unknown",
					language: sub.language ?? "und",
				})),
			fonts: (info?.fonts ?? []).map((x) =>
				withPresign(`${apiUrl}${x}`, presign?.signature),
			),
			metadata: {
				title: title ?? data?.path ?? "",
				artist: data?.show?.name ?? undefined,
				imageLink: data?.show?.thumbnail
					? withPresign(
							`${apiUrl}${data.show.thumbnail.high}`,
							presign?.signature,
						)
					: undefined,
				hasPrev: !!data?.previous?.video,
				hasNext: !!data?.next?.video,
			},
			castId: `${apiUrl}/api/videos/${slug}`,
			castData: {
				apiUrl,
				slug,
				clientId,
				...(presign && { presign: presign.signature }),
				title: title ?? data?.path ?? "",
				...(data?.show?.name && { subtitle: data.show.name }),
				...(data?.show?.poster?.id && {
					poster: `${apiUrl}/api/images/${data.show.poster.id}?quality=high${
						presign ? `&x-presign=${presign.signature}` : ""
					}`,
				}),
			},
		}),
		[apiUrl, slug, playMode, info, authToken, start, data, title, presign],
	);

	const presignReady = !authToken || !!presign;
	useEffect(() => {
		if (!presignReady) return;
		if (
			Platform.OS !== "web" &&
			(player.castStatus === "connected" ||
				player.castStatus === "connecting") &&
			(!data || player.source?.castId === source.castId)
		) {
			// do not re-set the source when casting the correct content,
			// it would restart playback
			return;
		}
		setPlayerSource(player, source);
	}, [source, player, presignReady, data]);

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

	const onEnd = () => {
		if (data?.next) player.playNext();
		else if (data?.show?.href) router.replace(data.show.href);
	};

	useProgressObserver(
		data && entry ? { videoId: data.id, entryId: entry.id } : null,
	);
	useLanguagePreference(slug, data?.show?.original.language);

	useEvent("end", onEnd);
	useEvent("prev", () => {
		if (!data?.previous) return;
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
		if (!data?.next) return;
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
				/>
			) : (
				<PlayModeContext.Provider value={playModeState}>
					<PlayerContent
						data={data}
						info={info}
						entry={entry}
						playMode={playMode}
						setPlayMode={playModeState[1]}
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
	playbackError,
	setPlaybackError,
	seekEnd,
}: {
	data?: FullVideo;
	info?: VideoInfo;
	entry?: FullVideo["entries"][number];
	playMode: PlayMode;
	setPlayMode: (mode: PlayMode) => void;
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
				forceShow={!!playbackError}
			/>
			{data?.show?.kind === "serie" && (
				<EntriesMenu
					isOpen={entriesMenuOpen}
					onClose={() => setEntriesMenuOpen(false)}
					showSlug={data.show.slug}
					season={entry?.kind === "episode" ? entry.seasonNumber : 0}
					currentEntrySlug={entry?.slug}
				/>
			)}
		</>
	);
};

Player.query = (slug: string): QueryIdentifier<FullVideo> => ({
	path: ["api", "videos", slug],
	params: {
		with: ["next", "previous", "show"],
	},
	parser: FullVideo,
});

Player.presignQuery = (
	slug: string,
	path: string | undefined,
	imageIds: (string | undefined)[],
	entryId: string | undefined,
): QueryIdentifier<z.infer<typeof CastPresign>> => ({
	path: ["auth", "presign"],
	params: { slug },
	enabled: !!path,
	parser: CastPresign,
	options: {
		method: "POST",
		body: {
			for: [
				{ prefix: `/api/videos/${slug}`, verb: "GET" },
				{ url: "/api/ws", verb: "GET" },
				...(path
					? [{ prefix: `/video/${base64UrlPath(path)}`, verb: "GET" }]
					: []),
				...imageIds
					.filter((id) => !!id)
					.map((id) => ({ url: `/api/images/${id}`, verb: "GET" })),
			],
			...(entryId && { claims: { wsRoutes: [`watch/${entryId}`] } }),
			duration: "24h",
		},
		returnError: true,
	},
});
