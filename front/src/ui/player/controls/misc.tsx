import FullscreenExit from "@material-symbols/svg-400/rounded/fullscreen_exit-fill.svg";
import Fullscreen from "@material-symbols/svg-400/rounded/fullscreen-fill.svg";
import Pause from "@material-symbols/svg-400/rounded/pause-fill.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import VolumeDown from "@material-symbols/svg-400/rounded/volume_down-fill.svg";
import VolumeMute from "@material-symbols/svg-400/rounded/volume_mute-fill.svg";
import VolumeOff from "@material-symbols/svg-400/rounded/volume_off-fill.svg";
import VolumeUp from "@material-symbols/svg-400/rounded/volume_up-fill.svg";
import { type ComponentProps, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { type PressableProps, View } from "react-native";
import { useEvent, type VideoPlayer } from "react-native-video";
import { CircularProgress, IconButton, Slider, tooltip } from "~/primitives";
import { cn } from "~/utils";

export const PlayButton = ({
	player,
	...props
}: { player: VideoPlayer } & Partial<
	ComponentProps<typeof IconButton<PressableProps>>
>) => {
	const { t } = useTranslation();

	const [playing, setPlay] = useState(player.isPlaying);
	useEvent(player, "onPlaybackStateChange", (status) => {
		setPlay(status.isPlaying);
	});

	return (
		<IconButton
			icon={playing ? Pause : PlayArrow}
			onPress={() => {
				if (playing) player.pause();
				else player.play();
			}}
			{...tooltip(playing ? t("player.pause") : t("player.play"), true)}
			{...props}
		/>
	);
};

export const toggleFullscreen = async (set?: boolean) => {
	set ??= document.fullscreenElement === null;
	try {
		if (set) {
			await document.body.requestFullscreen({ navigationUI: "hide" });
			// @ts-expect-error Firefox does not support this so ts complains
			await screen.orientation.lock("landscape");
		} else {
			if (document.fullscreenElement) await document.exitFullscreen();
			screen.orientation.unlock();
		}
	} catch (e) {
		console.log(e);
	}
};

export const FullscreenButton = (
	props: Partial<ComponentProps<typeof IconButton<PressableProps>>>,
) => {
	// this is a web only component
	const { t } = useTranslation();

	const [fullscreen, setFullscreen] = useState(false);
	useEffect(() => {
		const update = () => setFullscreen(document.fullscreenElement !== null);
		document.addEventListener("fullscreenchange", update);
		return () => document.removeEventListener("fullscreenchange", update);
	}, []);

	return (
		<IconButton
			icon={fullscreen ? FullscreenExit : Fullscreen}
			onPress={() => toggleFullscreen()}
			{...tooltip(t("player.fullscreen"), true)}
			{...props}
		/>
	);
};

export const VolumeSlider = ({
	player,
	className,
	iconClassName,
	...props
}: {
	player: VideoPlayer;
	className?: string;
	iconClassName?: string;
}) => {
	const { t } = useTranslation();

	const [volume, setVolume] = useState(player.volume);
	const [muted, setMuted] = useState(player.muted);
	useEvent(player, "onVolumeChange", (info) => {
		setVolume(info.volume);
		setMuted(info.muted);
	});

	return (
		<View
			className={cn("flex-row items-center pr-2 max-sm:hidden", className)}
			{...props}
		>
			<IconButton
				icon={
					muted || volume === 0
						? VolumeOff
						: volume < 0.25
							? VolumeMute
							: volume < 0.65
								? VolumeDown
								: VolumeUp
				}
				onPress={() => {
					player.muted = !muted;
				}}
				iconClassName={iconClassName}
				{...tooltip(t("player.mute"), true)}
			/>
			<Slider
				progress={volume * 100}
				setProgress={(vol) => {
					player.volume = vol / 100;
				}}
				className="h-1 w-24"
				{...tooltip(t("player.volume"), true)}
			/>
		</View>
	);
};

export const LoadingIndicator = ({ player }: { player: VideoPlayer }) => {
	const [isLoading, setLoading] = useState(false);

	useEvent(player, "onStatusChange", (status) => {
		setLoading(status === "loading");
	});

	if (!isLoading) return null;

	return (
		<View className="pointer-events-none absolute inset-0 justify-center bg-slate-900/30">
			<CircularProgress className="self-center" />
		</View>
	);
};
