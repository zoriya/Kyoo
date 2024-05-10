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

import { IconButton, Link, P, Slider, noTouch, tooltip, touchOnly, ts } from "@kyoo/primitives";
import { useAtom, useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import SkipPrevious from "@material-symbols/svg-400/rounded/skip_previous-fill.svg";
import SkipNext from "@material-symbols/svg-400/rounded/skip_next-fill.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import Pause from "@material-symbols/svg-400/rounded/pause-fill.svg";
import VolumeOff from "@material-symbols/svg-400/rounded/volume_off-fill.svg";
import VolumeMute from "@material-symbols/svg-400/rounded/volume_mute-fill.svg";
import VolumeDown from "@material-symbols/svg-400/rounded/volume_down-fill.svg";
import VolumeUp from "@material-symbols/svg-400/rounded/volume_up-fill.svg";
import { durationAtom, mutedAtom, playAtom, progressAtom, volumeAtom } from "../state";
import { Stylable, px, useYoshiki } from "yoshiki/native";
import { HoverTouch, hoverAtom } from "./hover";

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
						{...css([!previousSlug && { opacity: 0, pointerEvents: "none" }], common)}
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
						{...css([!nextSlug && { opacity: 0, pointerEvents: "none" }], common)}
					/>
				</>
			)}
		</HoverTouch>
	);
};

const VolumeSlider = () => {
	const [volume, setVolume] = useAtom(volumeAtom);
	const [isMuted, setMuted] = useAtom(mutedAtom);
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<View
			{...css({
				display: { xs: "none", sm: "flex" },
				alignItems: "center",
				flexDirection: "row",
				paddingRight: ts(1),
			})}
		>
			<IconButton
				icon={
					isMuted || volume === 0
						? VolumeOff
						: volume < 25
							? VolumeMute
							: volume < 65
								? VolumeDown
								: VolumeUp
				}
				onPress={() => setMuted(!isMuted)}
				{...tooltip(t("player.mute"), true)}
			/>
			<Slider
				progress={volume}
				setProgress={setVolume}
				size={4}
				{...css({ width: px(100) })}
				{...tooltip(t("player.volume"), true)}
			/>
		</View>
	);
};

const ProgressText = (props: Stylable) => {
	const progress = useAtomValue(progressAtom);
	const duration = useAtomValue(durationAtom);
	const { css } = useYoshiki();

	return (
		<P {...css({ alignSelf: "center" }, props)}>
			{toTimerString(progress, duration)} : {toTimerString(duration)}
		</P>
	);
};

export const toTimerString = (timer?: number, duration?: number) => {
	if (!duration) duration = timer;
	if (
		timer === undefined ||
		duration === undefined ||
		Number.isNaN(duration) ||
		Number.isNaN(timer)
	)
		return "??:??";
	const h = Math.floor(timer / 3600);
	const min = Math.floor((timer / 60) % 60);
	const sec = Math.floor(timer % 60);
	const fmt = (n: number) => n.toString().padStart(2, "0");

	if (duration >= 3600) return `${fmt(h)}:${fmt(min)}:${fmt(sec)}`;
	return `${fmt(min)}:${fmt(sec)}`;
};
