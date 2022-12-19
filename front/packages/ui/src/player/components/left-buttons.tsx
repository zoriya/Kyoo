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

import { IconButton, Link, P, tooltip, ts } from "@kyoo/primitives";
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
import { useYoshiki } from "yoshiki/native";

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
					{...tooltip(t("player.previous"))}
					{...spacing}
				/>
			)}
			<IconButton
				icon={isPlaying ? Pause : PlayArrow}
				onClick={() => setPlay(!isPlaying)}
				{...tooltip(isPlaying ? t("player.pause") : t("player.play"))}
				{...spacing}
			/>
			{nextSlug && (
				<IconButton
					icon={SkipNext}
					as={Link}
					href={nextSlug}
					{...tooltip(t("next"))}
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

	return null;
	return (
		<View
			{...css({
				display: { xs: "none", sm: "flex" },
				p: ts(1),
				"body.hoverEnabled &:hover .slider": { width: "100px", px: "16px" },
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
				onClick={() => setMuted(!isMuted)}
				{...tooltip(t("mute"))}
			/>
			<View
				className="slider"
				sx={{
					width: 0,
					transition: "width .2s cubic-bezier(0.4,0, 1, 1), padding .2s cubic-bezier(0.4,0, 1, 1)",
					overflow: "hidden",
					alignSelf: "center",
				}}
			>
				<Slider
					value={volume}
					onChange={(_, value) => setVolume(value as number)}
					size="small"
					aria-label={t("volume")}
					sx={{ alignSelf: "center" }}
				/>
			</View>
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

const toTimerString = (timer: number, duration?: number) => {
	if (!duration) duration = timer;
	if (duration >= 3600) return new Date(timer * 1000).toISOString().substring(11, 19);
	return new Date(timer * 1000).toISOString().substring(14, 19);
};
