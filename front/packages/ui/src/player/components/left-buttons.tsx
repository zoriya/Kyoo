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

import { Box, IconButton, Slider, Tooltip, Typography } from "@mui/material";
import { useAtom, useAtomValue } from "jotai";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { durationAtom, mutedAtom, playAtom, progressAtom, volumeAtom } from "../state";
import NextLink from "next/link";
import {
	Pause,
	PlayArrow,
	SkipNext,
	SkipPrevious,
	VolumeDown,
	VolumeMute,
	VolumeOff,
	VolumeUp,
} from "@mui/icons-material";

export const LeftButtons = ({
	previousSlug,
	nextSlug,
}: {
	previousSlug?: string;
	nextSlug?: string;
}) => {
	const { t } = useTranslation("player");
	const router = useRouter();
	const [isPlaying, setPlay] = useAtom(playAtom);

	return (
		<Box
			sx={{
				display: "flex",
				"> *": {
					mx: { xs: "2px !important", sm: "8px !important" },
					p: { xs: "4px !important", sm: "8px !important" },
				},
			}}
		>
			{previousSlug && (
				<Tooltip title={t("previous")}>
					<NextLink href={{ query: { ...router.query, slug: previousSlug } }} passHref>
						<IconButton aria-label={t("previous")} sx={{ color: "white" }}>
							<SkipPrevious />
						</IconButton>
					</NextLink>
				</Tooltip>
			)}
			<Tooltip title={isPlaying ? t("pause") : t("play")}>
				<IconButton
					onClick={() => setPlay(!isPlaying)}
					aria-label={isPlaying ? t("pause") : t("play")}
					sx={{ color: "white" }}
				>
					{isPlaying ? <Pause /> : <PlayArrow />}
				</IconButton>
			</Tooltip>
			{nextSlug && (
				<Tooltip title={t("next")}>
					<NextLink href={{ query: { ...router.query, slug: nextSlug } }} passHref>
						<IconButton aria-label={t("next")} sx={{ color: "white" }}>
							<SkipNext />
						</IconButton>
					</NextLink>
				</Tooltip>
			)}
			<VolumeSlider />
			<ProgressText />
		</Box>
	);
};

const VolumeSlider = () => {
	const [volume, setVolume] = useAtom(volumeAtom);
	const [isMuted, setMuted] = useAtom(mutedAtom);
	const { t } = useTranslation("player");

	return (
		<Box
			sx={{
				display: { xs: "none", sm: "flex" },
				m: "0 !important",
				p: "8px",
				"body.hoverEnabled &:hover .slider": { width: "100px", px: "16px" },
			}}
		>
			<Tooltip title={t("mute")}>
				<IconButton
					onClick={() => setMuted(!isMuted)}
					aria-label={t("mute")}
					sx={{ color: "white" }}
				>
					{isMuted || volume == 0 ? (
						<VolumeOff />
					) : volume < 25 ? (
						<VolumeMute />
					) : volume < 65 ? (
						<VolumeDown />
					) : (
						<VolumeUp />
					)}
				</IconButton>
			</Tooltip>
			<Box
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
			</Box>
		</Box>
	);
};

const ProgressText = () => {
	const progress = useAtomValue(progressAtom);
	const duration = useAtomValue(durationAtom);

	return (
		<Typography color="white" sx={{ alignSelf: "center" }}>
			{toTimerString(progress, duration)} : {toTimerString(duration)}
		</Typography>
	);
};

const toTimerString = (timer: number, duration?: number) => {
	if (!duration) duration = timer;
	if (duration >= 3600) return new Date(timer * 1000).toISOString().substring(11, 19);
	return new Date(timer * 1000).toISOString().substring(14, 19);
};
