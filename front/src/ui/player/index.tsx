import "react-native-get-random-values";

import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useQueryState } from "~/utils";
import { CastingScreen } from "./casting-screen";
import { Controls, LoadingIndicator } from "./controls";
import { ErrorPopup } from "./controls/error-popup";
import { toggleFullscreen } from "./controls/misc";
import { PlayModeContext } from "./controls/tracks-menu";
import { EntriesMenu } from "./entries-menu";
import { useKeyboard } from "./keyboard";
import { useLanguagePreference } from "./language-preference";
import { useProgressObserver } from "./progress-observer";

const clientId = uuidv4();

const CastPresign = z.object({ signature: z.string() });

const base64UrlPath = (path: string): string =>
	typeof window !== "undefined" && window.btoa
		? window.btoa(path).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
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
			data?.show?.poster?.id,
		),
	);
	const [defaultPlayMode] = useLocalSetting<PlayMode>("playMode", "direct");
	const playModeState = useState(defaultPlayMode);
	const [playMode] = playModeState;
	const [playbackError, setPlaybackError] = useState<KyooError | undefined>();

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
						: "application/vnd.apple.mpegurl",
				headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
			},
			startTime: start ? Number.parseInt(start, 10) : data?.progress.time,
			subtitles: (info?.subtitles ?? [])
				.filter(
					(x) => Platform.OS === "web" || playMode === "hls" || x.isExternal,
				)
				.map((x, i) => ({
					// we also add those without link to prevent the order from getting out
					// of sync with `info.subtitles`. since we never actually play those
					// this is fine.
					id: (x.index ?? i).toString(),
					link: withPresign(
						(x.codec === "subrip" && x.link && Platform.OS === "web"
							? `${x.link}?format=vtt`
							: x.link) ?? "",
						presign?.signature,
					),
					label: x.title ?? "Unknown",
					language: x.language ?? "und",
				})),
			fonts: (info?.fonts ?? []).map((x) => withPresign(x, presign?.signature)),
			metadata: {
				title: title ?? data?.path ?? "",
				artist: data?.show?.name ?? undefined,
				imageLink: data?.show?.thumbnail?.high ?? undefined,
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

	const player = usePlayer();
	useEffect(() => {
		player.source = source;
	}, [source, player]);

	// When leaving the watch screen, unload the player unless it is casting (the
	// mini-player then keeps driving the receiver).
	const castStatus = usePlayerState("castStatus");
	const castingRef = useRef(false);
	castingRef.current =
		castStatus === "connected" || castStatus === "connecting";
	useEffect(() => {
		return () => {
			if (!castingRef.current) player.source = undefined;
		};
	}, [player]);

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
			<PlayModeContext.Provider value={playModeState}>
				<PlayerContent
					data={data}
					info={info}
					entry={entry}
					slug={slug}
					setSlug={setSlug}
					setStart={setStart}
					playMode={playMode}
					setPlayMode={playModeState[1]}
					playbackError={playbackError}
					setPlaybackError={setPlaybackError}
				/>
			</PlayModeContext.Provider>
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
	slug,
	setSlug,
	setStart,
	playMode,
	setPlayMode,
	playbackError,
	setPlaybackError,
}: {
	data?: FullVideo;
	info?: VideoInfo;
	entry?: FullVideo["entries"][number];
	slug: string;
	setSlug: (slug: string) => void;
	setStart: (start: string | undefined) => void;
	playMode: PlayMode;
	setPlayMode: (mode: PlayMode) => void;
	playbackError?: KyooError;
	setPlaybackError: (error: KyooError | undefined) => void;
}) => {
	const router = useRouter();
	const { t } = useTranslation();
	const player = usePlayer();
	const [entriesMenuOpen, setEntriesMenuOpen] = useState(false);

	const onEnd = useCallback(() => {
		if (data?.next) player.playNext();
		else if (data?.show?.href) router.replace(data.show.href);
	}, [data?.next, data?.show?.href, player, router]);

	useProgressObserver(
		data && entry ? { videoId: data.id, entryId: entry.id } : null,
	);
	useLanguagePreference(slug, data?.show?.original.language);

	useEvent("end", onEnd);
	useEvent(
		"prev",
		useCallback(() => {
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
		}, [data?.previous, setSlug, setStart, setPlaybackError, t]),
	);
	useEvent(
		"next",
		useCallback(() => {
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
		}, [data?.next, setSlug, setStart, setPlaybackError, t]),
	);

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
				seekEnd={onEnd}
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
	posterId: string | undefined,
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
				...(path
					? [{ prefix: `/video/${base64UrlPath(path)}`, verb: "GET" }]
					: []),
				...(posterId
					? [{ url: `/api/images/${posterId}`, verb: "GET" }]
					: []),
			],
			duration: "24h",
		},
		returnError: true,
	},
});
