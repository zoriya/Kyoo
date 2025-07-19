import { useSetAtom } from "jotai";
import { type ComponentProps, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import {
	Episode,
	Movie,
	type QueryIdentifier,
	useFetch,
	type WatchInfo,
	WatchInfoP,
} from "~/models";
import { Head } from "~/primitives";
import { Back, Hover, LoadingIndicator } from "./components/hover";
import { useVideoKeyboard } from "./keyboard";
import { durationAtom, fullscreenAtom, Video } from "./state";
import { WatchStatusObserver } from "./watch-status-observer";

type Item = (Movie & { type: "movie" }) | (Episode & { type: "episode" });

const mapData = (
	data: Item | undefined,
	info: WatchInfo | undefined,
	previousSlug?: string,
	nextSlug?: string,
): Partial<ComponentProps<typeof Hover>> & { isLoading: boolean } => {
	if (!data) return { isLoading: true };
	return {
		isLoading: false,
		name:
			data.type === "movie"
				? data.name
				: `${episodeDisplayNumber(data)} ${data.name}`,
		showName: data.type === "movie" ? data.name! : data.show!.name,
		poster: data.type === "movie" ? data.poster : data.show!.poster,
		subtitles: info?.subtitles,
		audios: info?.audios,
		chapters: info?.chapters,
		fonts: info?.fonts,
		previousSlug,
		nextSlug,
	};
};

const formatTitleMetadata = (item: Item) => {
	if (item.type === "movie") {
		return item.name;
	}
	return `${item.name} (${episodeDisplayNumber({
		seasonNumber: item.seasonNumber,
		episodeNumber: item.episodeNumber,
		absoluteNumber: item.absoluteNumber,
	})})`;
};

export const Player = ({
	slug,
	type,
	t: startTimeP,
}: {
	slug: string;
	type: "episode" | "movie";
	t?: number;
}) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const router = useRouter();

	const [playbackError, setPlaybackError] = useState<string | undefined>(
		undefined,
	);
	const { data, error } = useFetch(Player.query(type, slug));
	const { data: info, error: infoError } = useFetch(
		Player.infoQuery(type, slug),
	);
	const image =
		data && data.type === "episode"
			? (data.show?.poster ?? data?.poster)
			: data?.poster;
	const previous =
		data && data.type === "episode" && data.previousEpisode
			? `/watch/${data.previousEpisode.slug}?t=0`
			: undefined;
	const next =
		data && data.type === "episode" && data.nextEpisode
			? `/watch/${data.nextEpisode.slug}?t=0`
			: undefined;
	const title = data && formatTitleMetadata(data);
	const subtitle =
		data && data.type === "episode" ? data.show?.name : undefined;

	useVideoKeyboard(info?.subtitles, info?.fonts, previous, next);

	const startTime = startTimeP ?? data?.watchStatus?.watchedTime;

	const setFullscreen = useSetAtom(fullscreenAtom);
	useEffect(() => {
		if (Platform.OS !== "web") return;
		if (/Mobi/i.test(window.navigator.userAgent)) setFullscreen(true);
		return () => {
			if (!document.location.href.includes("/watch")) setFullscreen(false);
		};
	}, [setFullscreen]);

	const setDuration = useSetAtom(durationAtom);
	useEffect(() => {
		setDuration(info?.durationSeconds);
	}, [info, setDuration]);

	if (error || infoError || playbackError)
		return (
			<>
				<Back
					isLoading={false}
					{...css({ position: "relative", bg: (theme) => theme.accent })}
				/>
				<ErrorView error={error ?? infoError ?? { errors: [playbackError!] }} />
			</>
		);

	return (
		<>
			<Head title={title} description={data?.overview} />
			{data && info && (
				<WatchStatusObserver
					type={type}
					slug={data.slug}
					duration={info.durationSeconds}
				/>
			)}
			<View
				{...css({
					flexGrow: 1,
					flexShrink: 1,
					bg: "black",
				})}
			>
				<Video
					metadata={{
						title: title ?? t("show.episodeNoMetadata"),
						artist: subtitle ?? undefined,
						description: data?.overview ?? undefined,
						imageUri: image?.medium,
						next: next,
						previous: previous,
					}}
					links={data?.links}
					audios={info?.audios}
					subtitles={info?.subtitles}
					codec={info?.mimeCodec}
					setError={setPlaybackError}
					fonts={info?.fonts}
					startTime={startTime}
					onEnd={() => {
						if (!data) return;
						if (data.type === "movie")
							router.replace(`/movie/${data.slug}`, undefined, {
								experimental: {
									nativeBehavior: "stack-replace",
									isNestedNavigator: true,
								},
							});
						else
							router.replace(next ?? `/show/${data.show!.slug}`, undefined, {
								experimental: {
									nativeBehavior: "stack-replace",
									isNestedNavigator: true,
								},
							});
					}}
					{...css(StyleSheet.absoluteFillObject)}
				/>
				<LoadingIndicator />
				<Hover
					{...mapData(data, info, previous, next)}
					url={`${type}/${slug}`}
				/>
			</View>
		</>
	);
};

Player.query = (
	type: "episode" | "movie",
	slug: string,
): QueryIdentifier<Item> =>
	type === "episode"
		? {
				path: ["episode", slug],
				params: {
					fields: ["nextEpisode", "previousEpisode", "show", "watchStatus"],
				},
				parser: EpisodeP.transform((x) => ({ ...x, type: "episode" })),
			}
		: {
				path: ["movie", slug],
				params: {
					fields: ["watchStatus"],
				},
				parser: MovieP.transform((x) => ({ ...x, type: "movie" })),
			};

Player.infoQuery = (
	type: "episode" | "movie",
	slug: string,
): QueryIdentifier<WatchInfo> => ({
	path: [type, slug, "info"],
	parser: WatchInfoP,
});
