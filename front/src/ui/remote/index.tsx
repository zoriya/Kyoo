import Forward10 from "@material-symbols/svg-400/rounded/forward_10-fill.svg";
import KeyboardArrowDown from "@material-symbols/svg-400/rounded/keyboard_arrow_down-fill.svg";
import Replay10 from "@material-symbols/svg-400/rounded/replay_10-fill.svg";
import SkipNext from "@material-symbols/svg-400/rounded/skip_next-fill.svg";
import SkipPrevious from "@material-symbols/svg-400/rounded/skip_previous-fill.svg";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { usePlayer, usePlayerState } from "react-native-omni";
import type { Chapter, KImage } from "~/models";
import {
	H1,
	IconButton,
	Link,
	P,
	Poster,
	Skeleton,
	tooltip,
} from "~/primitives";
import { useFetch } from "~/query";
import { Info } from "~/ui/info";
import { CastButton, PlayButton } from "~/ui/player/controls/misc";
import { ProgressBar, toTimerString } from "~/ui/player/controls/progress";
import { SkipChapterButton } from "~/ui/player/controls/skip-chapter";
import { AudioMenu, SubtitleMenu } from "~/ui/player/controls/tracks-menu";
import { cn, useQueryState } from "~/utils";

export const Remote = ({
	showHref,
	name,
	poster,
	subName,
	chapters,
	hasPrev,
	hasNext,
	seekEnd,
}: {
	showHref?: string;
	name?: string;
	poster?: KImage | null;
	subName?: string;
	chapters: Chapter[];
	hasPrev: boolean;
	hasNext: boolean;
	seekEnd: () => void;
}) => {
	const { t } = useTranslation();
	const router = useRouter();
	const player = usePlayer();
	const castStatus = usePlayerState("castStatus");

	const [slug, setSlug] = useQueryState<string>("slug", undefined!);
	const { data: info } = useFetch(Info.infoQuery(slug));
	const progress = usePlayerState("currentTime");
	const [seek, setSeek] = useState<number | null>(null);

	const source = usePlayerState("source");
	const playing = source?.src.uri.match(/\/videos\/([^/?]+)\//)?.[1];
	const lastPlaying = useRef(playing);
	useEffect(() => {
		if (!playing || playing === lastPlaying.current) return;
		lastPlaying.current = playing;
		if (playing === slug) return;
		setSlug(playing);
	}, [playing, slug, setSlug]);

	return (
		<View className="absolute inset-0 bg-slate-950 px-safe pt-safe pb-safe">
			<View className="flex-row items-center p-2">
				<IconButton
					icon={KeyboardArrowDown}
					onPress={() => {
						if (router.canGoBack()) router.back();
						else if (showHref) router.replace(showHref);
						else router.replace("/");
					}}
					iconClassName="fill-slate-200 dark:fill-slate-200"
					{...tooltip(t("player.back"))}
				/>
				<P numberOfLines={1} className="min-w-0 flex-1 px-2 text-slate-300">
					{castStatus === "connecting"
						? t("player.casting.connecting")
						: t("player.casting.playing")}
				</P>
				<CastButton iconClassName="fill-accent dark:fill-accent" />
			</View>

			<Link
				href={showHref}
				className="flex-1 items-center justify-center overflow-hidden"
			>
				{poster !== undefined ? (
					<Poster src={poster} quality="high" className="h-full" />
				) : (
					<Poster.Loader className="h-full" />
				)}
			</Link>

			<View className="px-4">
				{subName ? (
					<H1 numberOfLines={2} className="text-2xl text-slate-200">
						{subName}
					</H1>
				) : (
					<Skeleton className="h-8 w-2/3" />
				)}
				{name ? (
					<P numberOfLines={1} className="text-slate-400">
						{name}
					</P>
				) : null}
			</View>

			<View className="items-end px-4">
				<SkipChapterButton
					chapters={chapters}
					isVisible
					seekEnd={seekEnd}
					className="mt-2"
				/>
			</View>

			<View className="px-4 pt-4">
				<ProgressBar chapters={chapters} seek={seek} setSeek={setSeek} />
				<View className="flex-row justify-between pt-1">
					<P className="text-slate-400 text-xs">
						{toTimerString(seek ?? progress, info?.durationSeconds)}
					</P>
					<P className="text-slate-400 text-xs">
						{toTimerString(info?.durationSeconds)}
					</P>
				</View>
			</View>

			<View className="flex-row items-center justify-center py-4">
				<IconButton
					icon={SkipPrevious}
					onPress={() => player.playPrev()}
					disabled={!hasPrev}
					className={cn("p-3", !hasPrev && "opacity-30")}
					iconClassName="h-8 w-8 fill-slate-200 dark:fill-slate-200"
					{...tooltip(t("player.previous"))}
				/>
				<IconButton
					icon={Replay10}
					onPress={() => player.seekBy(-10)}
					className="p-3"
					iconClassName="h-8 w-8 fill-slate-200 dark:fill-slate-200"
					{...tooltip(t("remote.rewind"))}
				/>
				<PlayButton
					className="mx-4 bg-accent p-4"
					iconClassName="h-12 w-12 fill-slate-200 dark:fill-slate-200"
				/>
				<IconButton
					icon={Forward10}
					onPress={() => player.seekBy(10)}
					className="p-3"
					iconClassName="h-8 w-8 fill-slate-200 dark:fill-slate-200"
					{...tooltip(t("remote.forward"))}
				/>
				<IconButton
					icon={SkipNext}
					onPress={() => player.playNext()}
					disabled={!hasNext}
					className={cn("p-3", !hasNext && "opacity-30")}
					iconClassName="h-8 w-8 fill-slate-200 dark:fill-slate-200"
					{...tooltip(t("player.next"))}
				/>
			</View>

			<View className="flex-row items-center justify-center pb-2">
				<SubtitleMenu
					className="mx-2 p-3"
					iconClassName="h-6 w-6 fill-slate-200 dark:fill-slate-200"
				/>
				<AudioMenu
					className="mx-2 p-3"
					iconClassName="h-6 w-6 fill-slate-200 dark:fill-slate-200"
				/>
			</View>
		</View>
	);
};
