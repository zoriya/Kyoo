/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import {
	Episode,
	EpisodeP,
	Movie,
	MovieP,
	QueryIdentifier,
	WatchInfo,
	WatchInfoP,
	useFetch,
} from "@kyoo/models";
import { Head } from "@kyoo/primitives";
import { useState, useEffect, ComponentProps } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "solito/router";
import { useSetAtom } from "jotai";
import { useYoshiki } from "yoshiki/native";
import { Back, Hover, LoadingIndicator } from "./components/hover";
import { durationAtom, fullscreenAtom, Video } from "./state";
import { episodeDisplayNumber } from "../details/episode";
import { useVideoKeyboard } from "./keyboard";
import { MediaSessionManager } from "./media-session";
import { WatchStatusObserver } from "./watch-status-observer";
import { ErrorView } from "../errors";

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
		name: data.type === "movie" ? data.name : `${episodeDisplayNumber(data, "")} ${data.name}`,
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

	const [playbackError, setPlaybackError] = useState<string | undefined>(undefined);
	const { data, error } = useFetch(Player.query(type, slug));
	const { data: info, error: infoError } = useFetch(Player.infoQuery(type, slug));
	const previous =
		data && data.type === "episode" && data.previousEpisode
			? `/watch/${data.previousEpisode.slug}?t=0`
			: undefined;
	const next =
		data && data.type === "episode" && data.nextEpisode
			? `/watch/${data.nextEpisode.slug}?t=0`
			: undefined;

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
				<Back isLoading={false} {...css({ position: "relative", bg: (theme) => theme.accent })} />
				<ErrorView error={error ?? infoError ?? { errors: [playbackError!] }} />
			</>
		);

	return (
		<>
			{data && (
				<Head
					title={
						data.type === "movie"
							? data.name
							: `${data.show!.name} ${episodeDisplayNumber({
									seasonNumber: data.seasonNumber,
									episodeNumber: data.episodeNumber,
									absoluteNumber: data.absoluteNumber,
								})}`
					}
					description={data.overview}
				/>
			)}
			<MediaSessionManager
				title={data?.name ?? t("show.episodeNoMetadata")}
				image={data?.thumbnail?.high}
				next={next}
				previous={previous}
			/>
			{data && info && (
				<WatchStatusObserver type={type} slug={data.slug} duration={info.durationSeconds} />
			)}
			<View
				{...css({
					flexGrow: 1,
					flexShrink: 1,
					bg: "black",
				})}
			>
				<Video
					links={data?.links}
					audios={info?.audios}
					subtitles={info?.subtitles}
					setError={setPlaybackError}
					fonts={info?.fonts}
					startTime={startTime}
					onEnd={() => {
						if (!data) return;
						if (data.type === "movie")
							router.replace(`/movie/${data.slug}`, undefined, {
								experimental: { nativeBehavior: "stack-replace", isNestedNavigator: true },
							});
						else
							router.replace(next ?? `/show/${data.show!.slug}`, undefined, {
								experimental: { nativeBehavior: "stack-replace", isNestedNavigator: true },
							});
					}}
					{...css(StyleSheet.absoluteFillObject)}
				/>
				<LoadingIndicator />
				<Hover {...mapData(data, info, previous, next)} url={`${type}/${slug}`} />
			</View>
		</>
	);
};

Player.query = (type: "episode" | "movie", slug: string): QueryIdentifier<Item> =>
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

Player.infoQuery = (type: "episode" | "movie", slug: string): QueryIdentifier<WatchInfo> => ({
	path: [type, slug, "info"],
	parser: WatchInfoP,
});

// if more queries are needed, dont forget to update download.tsx to cache those.
Player.getFetchUrls = ({ slug, type }: { slug: string; type: "episode" | "movie" }) => [
	Player.query(type, slug),
	Player.infoQuery(type, slug),
];
