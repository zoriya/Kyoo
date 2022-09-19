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

import { Box, Divider, Skeleton, SxProps, Typography } from "@mui/material";
import useTranslation from "next-translate/useTranslation";
import { Episode } from "~/models";
import { Link } from "~/utils/link";
import { Image } from "./poster";

const displayNumber = (episode: Episode) => {
	if (typeof episode.seasonNumber === "number" && typeof episode.episodeNumber === "number")
		return `S${episode.seasonNumber}:E${episode.episodeNumber}`;
	if (episode.absoluteNumber) return episode.absoluteNumber.toString();
	return "???";
};

export const EpisodeBox = ({ episode, sx }: { episode?: Episode; sx: SxProps }) => {
	return (
		<Box sx={sx}>
			<Image img={episode?.thumbnail} width="100%" aspectRatio="16/9" />
			<Typography>{episode?.name ?? <Skeleton />}</Typography>
			<Typography variant="body2">{episode?.overview ?? <Skeleton />}</Typography>
		</Box>
	);
};

export const EpisodeLine = ({ episode, sx }: { episode?: Episode; sx?: SxProps }) => {
	const { t } = useTranslation("browse"); 

	return (
		<>
			<Link
				href={episode ? `/watch/${episode.slug}` : ""}
				color="inherit"
				underline="none"
				sx={{
					m: 2,
					display: "flex",
					alignItems: "center",
					"& > *": { m: 1 },
					...sx,
				}}
			>
				<Typography variant="overline" align="center" sx={{ width: "4rem", flexShrink: 0 }}>
					{episode ? displayNumber(episode) : <Skeleton />}
				</Typography>
				<Image img={episode?.thumbnail} width="18%" aspectRatio="16/9" sx={{ flexShrink: 0 }} />
				{episode ? (
					<Box sx={{ flexGrow: 1 }}>
						<Typography variant="h6">{episode.name ?? t("show.episodeNoMetadata")}</Typography>
						{episode.overview && <Typography variant="body2">{episode.overview}</Typography>}
					</Box>
				) : (
					<Box sx={{ flexGrow: 1 }}>
						<Typography variant="h6">{<Skeleton />}</Typography>
						<Typography variant="body2">{<Skeleton />}</Typography>
					</Box>
				)}
			</Link>
			<Divider />
		</>
	);
};
