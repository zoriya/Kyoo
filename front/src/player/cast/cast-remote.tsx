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

import { ClosedCaption, Pause, PlayArrow, SkipNext, SkipPrevious } from "@mui/icons-material";
import { IconButton, Tooltip, Typography } from "@mui/material";
import { Box } from "@mui/system";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { Poster } from "~/components/poster";
import { ProgressBar } from "../components/progress-bar";
import NextLink from "next/link";

export const CastRemote = () => {
	const name = "Ansatsu Kyoushitsu";
	const episodeName = "S1:E1 Assassination Time";
	const poster = "/api/show/ansatsu-kyoushitsu/poster";
	const previousSlug = "toto";
	const nextSlug = "toto";
	const isPlaying = false;
	const subtitles: never[] = [];
	const setPlay = (obol: boolean) => {};

	const { t } = useTranslation("browse");
	const router = useRouter();

	return (
		<Box sx={{ display: "flex", background: "red", flexDirection: "column", alignItems: "center" }}>
			<Poster img={poster} alt="" width={"60%"} />
			<Typography variant="h1">{name}</Typography>
			{episodeName && <Typography variant="h2">{episodeName}</Typography>}
			{/* <ProgressBar /> */}
			<Box sx={{ display: "flex" }}>
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
				{subtitles && (
					<Tooltip title={t("subtitles")}>
						<IconButton
							id="sortby"
							aria-label={t("subtitles")}
							/* aria-controls={subtitleAnchor ? "subtitle-menu" : undefined} */
							aria-haspopup="true"
							/* aria-expanded={subtitleAnchor ? "true" : undefined} */
							onClick={(event) => {
								/* setSubtitleAnchor(event.currentTarget); */
								/* onMenuOpen(); */
							}}
							sx={{ color: "white" }}
						>
							<ClosedCaption />
						</IconButton>
					</Tooltip>
				)}
			</Box>
		</Box>
	);
};
