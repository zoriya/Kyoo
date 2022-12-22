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

import { IconButton, Link, P, Slider, tooltip, ts } from "@kyoo/primitives";
import { useAtom, useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import SkipPrevious from "@material-symbols/svg-400/rounded/skip_previous-fill.svg";
import SkipNext from "@material-symbols/svg-400/rounded/skip_next-fill.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import Pause from "@material-symbols/svg-400/rounded/pause-fill.svg";
import VolumeOff from "@material-symbols/svg-400/rounded/volume_off-fill.svg";
import VolumeMute from "@material-symbols/svg-400/rounded/volume_mute-fill.svg";
import VolumeDown from "@material-symbols/svg-400/rounded/volume_down-fill.svg";
import VolumeUp from "@material-symbols/svg-400/rounded/volume_up-fill.svg";
import { durationAtom, mutedAtom, playAtom, progressAtom, volumeAtom } from "../state";
import { px, useYoshiki } from "yoshiki/native";

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
			{previousSlug && (
				<IconButton
					icon={SkipPrevious}
					as={Link}
					href={previousSlug}
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
					{...tooltip(t("player.next"), true)}
					{...spacing}
				/>
			)}
			<VolumeSlider />
			<ProgressText />
		</View>
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
					isMuted || volume == 0
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

const ProgressText = () => {
	const progress = useAtomValue(progressAtom);
	const duration = useAtomValue(durationAtom);
	const { css } = useYoshiki();

	return (
		<P {...css({ alignSelf: "center", marginBottom: 0 })}>
			{toTimerString(progress, duration)} : {toTimerString(duration)}
		</P>
	);
};

const toTimerString = (timer?: number, duration?: number) => {
	if (timer === undefined) return "??:??";
	if (!duration) duration = timer;
	if (duration >= 3600_000) return new Date(timer).toISOString().substring(11, 19);
	return new Date(timer).toISOString().substring(14, 19);
};
