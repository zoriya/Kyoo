import { type CSSProperties, useState } from "react";
import type { TextProps } from "react-native";
import { useEvent, type VideoPlayer } from "react-native-video";
import { useResolveClassNames } from "uniwind";
import type { Chapter } from "~/models";
import { P, Slider, Tooltip } from "~/primitives";
import { useFetch } from "~/query";
import { Info } from "~/ui/info";
import { cn, useQueryState } from "~/utils";
import { ScrubberTooltip } from "../scrubber";

export const ProgressBar = ({
	player,
	chapters,
	seek,
	setSeek,
}: {
	player: VideoPlayer;
	chapters?: Chapter[];
	seek: number | null;
	setSeek: (v: number | null) => void;
}) => {
	const [slug] = useQueryState<string>("slug", undefined!);
	const { data } = useFetch(Info.infoQuery(slug));

	const [progress, setProgress] = useState(player.currentTime || 0);
	const [buffer, setBuffer] = useState(0);
	useEvent(player, "onProgress", (progress) => {
		setProgress(progress.currentTime);
		setBuffer(progress.bufferDuration);
	});

	const [hoverProgress, setHoverProgress] = useState<number | null>(null);
	const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
	const percent = hoverProgress! / (data?.durationSeconds ?? 1);

	return (
		<>
			<Slider
				progress={seek ?? progress}
				subtleProgress={buffer}
				max={data?.durationSeconds}
				startSeek={() => {
					player.pause();
				}}
				setProgress={setSeek}
				endSeek={() => {
					player.seekTo(seek!);
					setTimeout(() => player.play(), 10);
					setSeek(null);
				}}
				onHover={(progress, layout) => {
					setHoverProgress(progress);
					setLayout(layout);
				}}
				markers={chapters?.map((x) => x.startTime)}
				// @ts-expect-error dataSet is web only and not typed
				dataSet={{ tooltipId: "progress-scrubber" }}
			/>
			<Tooltip
				id={"progress-scrubber"}
				isOpen={hoverProgress !== null}
				// not a real fix, we should fix it upstream
				place={percent > 80 ? "top-end" : "top"}
				position={{
					x: layout.x + layout.width * percent,
					y: layout.y,
				}}
				render={() =>
					hoverProgress ? (
						<ScrubberTooltip
							seconds={hoverProgress}
							chapters={chapters}
							videoSlug={slug}
						/>
					) : null
				}
				opacity={1}
				style={{
					padding: 0,
					...(useResolveClassNames(
						cn("rounded bg-slate-200"),
					) as CSSProperties),
				}}
			/>
		</>
	);
};

export const ProgressText = ({
	player,
	className,
	...props
}: { player: VideoPlayer } & TextProps) => {
	const [progress, setProgress] = useState(player.currentTime);
	useEvent(player, "onProgress", (progress) => {
		setProgress(progress.currentTime);
	});
	const [slug] = useQueryState<string>("slug", undefined!);
	const { data } = useFetch(Info.infoQuery(slug));

	return (
		<P className={cn("text-center", className)} {...props}>
			{toTimerString(progress, data?.durationSeconds)} :{" "}
			{toTimerString(data?.durationSeconds)}
		</P>
	);
};

export const toTimerString = (timer?: number, duration?: number) => {
	if (!duration) duration = timer;
	if (timer === undefined || !Number.isFinite(timer)) return "??:??";

	const h = Math.floor(timer / 3600);
	const min = Math.floor((timer / 60) % 60);
	const sec = Math.floor(timer % 60);
	const fmt = (n: number) => n.toString().padStart(2, "0");

	return h !== 0 || (duration && duration >= 3600)
		? `${fmt(h)}:${fmt(min)}:${fmt(sec)}`
		: `${fmt(min)}:${fmt(sec)}`;
};
