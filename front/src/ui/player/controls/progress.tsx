import { useState } from "react";
import type { TextProps } from "react-native";
import { useEvent, type VideoPlayer } from "react-native-video";
import { useYoshiki } from "yoshiki/native";
import type { Chapter } from "~/models";
import { P, Slider } from "~/primitives";

export const ProgressBar = ({
	player,
	// url,
	chapters,
}: {
	player: VideoPlayer;
	// url: string;
	chapters?: Chapter[];
}) => {
	const [duration, setDuration] = useState(player.duration || 100);
	useEvent(player, "onLoad", (info) => {
		if (info.duration) setDuration(info.duration);
	});

	const [progress, setProgress] = useState(player.currentTime || 0);
	const [buffer, setBuffer] = useState(0);
	useEvent(player, "onProgress", (progress) => {
		setProgress(progress.currentTime);
		setBuffer(progress.bufferDuration);
	});

	const [seek, setSeek] = useState<number | null>(null);

	return (
		<>
			<Slider
				progress={seek ?? progress}
				subtleProgress={buffer}
				max={duration}
				startSeek={() => {
					player.pause();
				}}
				setProgress={setSeek}
				endSeek={() => {
					player.seekTo(seek!);
					setTimeout(() => player.play(), 10);
					setSeek(null);
				}}
				// onHover={(progress, layout) => {
				// 	setHoverProgress(progress);
				// 	setLayout(layout);
				// }}
				markers={chapters?.map((x) => x.startTime)}
				// dataSet={{ tooltipId: "progress-scrubber" }}
			/>
			{/* <Tooltip */}
			{/* 	id={"progress-scrubber"} */}
			{/* 	isOpen={hoverProgress !== null} */}
			{/* 	place="top" */}
			{/* 	position={{ */}
			{/* 		x: layout.x + (layout.width * hoverProgress!) / (duration ?? 1), */}
			{/* 		y: layout.y, */}
			{/* 	}} */}
			{/* 	render={() => */}
			{/* 		hoverProgress ? ( */}
			{/* 			<ScrubberTooltip */}
			{/* 				seconds={hoverProgress} */}
			{/* 				chapters={chapters} */}
			{/* 				url={url} */}
			{/* 			/> */}
			{/* 		) : null */}
			{/* 	} */}
			{/* 	opacity={1} */}
			{/* 	style={{ padding: 0, borderRadius: imageBorderRadius }} */}
			{/* /> */}
		</>
	);
};

export const ProgressText = ({
	player,
	...props
}: { player: VideoPlayer } & TextProps) => {
	const { css } = useYoshiki();

	const [progress, setProgress] = useState(player.currentTime);
	useEvent(player, "onProgress", (progress) => {
		setProgress(progress.currentTime);
	});
	const [duration, setDuration] = useState(player.duration);
	useEvent(player, "onLoad", (info) => {
		if (info.duration) setDuration(info.duration);
	});

	return (
		<P {...css({ alignSelf: "center" }, props)}>
			{toTimerString(progress, duration)} : {toTimerString(duration)}
		</P>
	);
};

const toTimerString = (timer?: number, duration?: number) => {
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
