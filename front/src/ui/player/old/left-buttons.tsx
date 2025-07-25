import {
	IconButton,
	Link,
	noTouch,
	tooltip,
	touchOnly,
	ts,
} from "@kyoo/primitives";
import Pause from "@material-symbols/svg-400/rounded/pause-fill.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import SkipNext from "@material-symbols/svg-400/rounded/skip_next-fill.svg";
import SkipPrevious from "@material-symbols/svg-400/rounded/skip_previous-fill.svg";
import { useAtom, useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import { px, type Stylable, useYoshiki } from "yoshiki/native";
import { HoverTouch, hoverAtom } from "../controls";
import { playAtom } from "./state";

export const LeftButtons = ({
	previousSlug,
	nextSlug,
}: {
	previousSlug?: string | null;
	nextSlug?: string | null;
}) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const [isPlaying, setPlay] = useAtom(playAtom);

	const spacing = css({ marginHorizontal: ts(1) });

	return (
		<View {...css({ flexDirection: "row" })}>
			<View {...css({ flexDirection: "row" }, noTouch)}>
				{previousSlug && (
					<IconButton
						icon={SkipPrevious}
						as={Link}
						href={previousSlug}
						replace
						{...tooltip(t("player.previous"), true)}
						{...spacing}
					/>
				)}
				<IconButton
					icon={isPlaying ? Pause : PlayArrow}
					onPress={() => setPlay(!isPlaying)}
					{...tooltip(isPlaying ? t("player.pause") : t("player.play"), true)}
					{...spacing}
				/>
				{nextSlug && (
					<IconButton
						icon={SkipNext}
						as={Link}
						href={nextSlug}
						replace
						{...tooltip(t("player.next"), true)}
						{...spacing}
					/>
				)}
				{Platform.OS === "web" && <VolumeSlider />}
			</View>
			<ProgressText {...css({ marginLeft: ts(1) })} />
		</View>
	);
};

export const TouchControls = ({
	previousSlug,
	nextSlug,
	...props
}: {
	previousSlug?: string | null;
	nextSlug?: string | null;
}) => {
	const { css } = useYoshiki();
	const [isPlaying, setPlay] = useAtom(playAtom);
	const hover = useAtomValue(hoverAtom);

	const common = css(
		[
			{
				backgroundColor: (theme) => theme.darkOverlay,
				marginHorizontal: ts(3),
			},
		],
		touchOnly,
	);

	return (
		<HoverTouch
			{...css(
				{
					flexDirection: "row",
					justifyContent: "center",
					alignItems: "center",
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
				},
				props,
			)}
		>
			{hover && (
				<>
					<IconButton
						icon={SkipPrevious}
						as={Link}
						href={previousSlug!}
						replace
						size={ts(4)}
						{...css(
							[!previousSlug && { opacity: 0, pointerEvents: "none" }],
							common,
						)}
					/>
					<IconButton
						icon={isPlaying ? Pause : PlayArrow}
						onPress={() => setPlay(!isPlaying)}
						size={ts(8)}
						{...common}
					/>
					<IconButton
						icon={SkipNext}
						as={Link}
						href={nextSlug!}
						replace
						size={ts(4)}
						{...css(
							[!nextSlug && { opacity: 0, pointerEvents: "none" }],
							common,
						)}
					/>
				</>
			)}
		</HoverTouch>
	);
};
