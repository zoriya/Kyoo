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

import { Pause, PlayArrow, SkipNext, SkipPrevious } from "@mui/icons-material";
import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { useAtom, useAtomValue } from "jotai";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { episodeDisplayNumber } from "~/components/episode";
import { Image } from "~/components/poster";
import { ProgressText, VolumeSlider } from "~/player/components/left-buttons";
import { ProgressBar } from "../components/progress-bar";
import { durationAtom, mediaAtom, progressAtom, playAtom } from "./state";

export const _CastMiniPlayer = () => {
	const { t } = useTranslation("player");
	const router = useRouter();

	const [media, setMedia] = useAtom(mediaAtom);
	const [isPlaying, togglePlay] = useAtom(playAtom);

	if (!media) return null;

	const previousSlug = "sng";
	const nextSlug = "toto";

	return (
		<Paper
			elevation={16}
			/* onClick={() => router.push("/remote")} */
			sx={{ height: "100px", display: "flex", justifyContent: "space-between" }}
		>
			<Box sx={{ display: "flex", alignItems: "center" }}>
				<Box sx={{ height: "100%", p: 2, boxSizing: "border-box" }}>
					<Image img={media.thumbnail} alt="" height="100%" aspectRatio="16/9" />
				</Box>
				<Box>
					{!media.isMovie && (
						<Typography>{media.showTitle + " " + episodeDisplayNumber(media)}</Typography>
					)}
					<Typography>{media.name}</Typography>
				</Box>
			</Box>
			<Box
				sx={{
					display: { xs: "none", md: "flex" },
					alignItems: "center",
					flexGrow: 1,
					flexShrink: 1,
				}}
			>
				<ProgressBar
					progressAtom={progressAtom}
					durationAtom={durationAtom}
					sx={{ flexShrink: 1 }}
				/>
				<ProgressText
					sx={{ flexShrink: 0 }}
					progressAtom={progressAtom}
					durationAtom={durationAtom}
				/>
			</Box>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					"> *": { mx: "16px !important" },
					"> .desktop": { display: { xs: "none", md: "inline-flex" } },
				}}
			>
				<VolumeSlider className="desktop" />
				{previousSlug && (
					<Tooltip title={t("previous")} className="desktop">
						<IconButton aria-label={t("previous")}>
							<SkipPrevious />
						</IconButton>
					</Tooltip>
				)}
				<Tooltip title={isPlaying ? t("pause") : t("play")}>
					<IconButton onClick={() => togglePlay()} aria-label={isPlaying ? t("pause") : t("play")}>
						{isPlaying ? <Pause /> : <PlayArrow />}
					</IconButton>
				</Tooltip>
				{nextSlug && (
					<Tooltip title={t("next")}>
						<IconButton aria-label={t("next")}>
							<SkipNext />
						</IconButton>
					</Tooltip>
				)}
			</Box>
		</Paper>
	);
};
