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

import { ClosedCaption, Fullscreen, FullscreenExit } from "@mui/icons-material";
import { Box, IconButton, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import { useAtom } from "jotai";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { useState } from "react";
import { Font, Track } from "~/models/resources/watch-item";
import { Link } from "~/utils/link";
import { CastButton } from "../cast/cast-button";
import { fullscreenAtom, subtitleAtom } from "../state";

export const RightButtons = ({
	subtitles,
	fonts,
	onMenuOpen,
	onMenuClose,
}: {
	subtitles?: Track[];
	fonts?: Font[];
	onMenuOpen: () => void;
	onMenuClose: () => void;
}) => {
	const { t } = useTranslation("player");
	const { t: tc } = useTranslation("common");
	const [subtitleAnchor, setSubtitleAnchor] = useState<HTMLButtonElement | null>(null);
	const [isFullscreen, setFullscreen] = useAtom(fullscreenAtom);

	return (
		<Box
			sx={{
				display: "flex",
				"> *": {
					m: { xs: "4px !important", sm: "8px !important" },
					p: { xs: "4px !important", sm: "8px !important" },
				},
			}}
		>
			{subtitles && (
				<Tooltip title={t("subtitles")}>
					<IconButton
						id="sortby"
						aria-label={t("subtitles")}
						aria-controls={subtitleAnchor ? "subtitle-menu" : undefined}
						aria-haspopup="true"
						aria-expanded={subtitleAnchor ? "true" : undefined}
						onClick={(event) => {
							setSubtitleAnchor(event.currentTarget);
							onMenuOpen();
						}}
						sx={{ color: "white" }}
					>
						<ClosedCaption />
					</IconButton>
				</Tooltip>
			)}
			<Tooltip title={tc("cast.start")}>
				<CastButton
					sx={{
						width: "24px",
						height: "24px",
						"--connected-color": "white",
						"--disconnected-color": "white",
					}}
				/>
			</Tooltip>
			<Tooltip title={t("fullscreen")}>
				<IconButton
					onClick={() => setFullscreen(!isFullscreen)}
					aria-label={t("fullscreen")}
					sx={{ color: "white" }}
				>
					{isFullscreen ? <FullscreenExit /> : <Fullscreen />}
				</IconButton>
			</Tooltip>
			{subtitleAnchor && (
				<SubtitleMenu
					subtitles={subtitles!}
					fonts={fonts!}
					anchor={subtitleAnchor}
					onClose={() => {
						setSubtitleAnchor(null);
						onMenuClose();
					}}
				/>
			)}
		</Box>
	);
};

const SubtitleMenu = ({
	subtitles,
	fonts,
	anchor,
	onClose,
}: {
	subtitles: Track[];
	fonts: Font[];
	anchor: HTMLElement;
	onClose: () => void;
}) => {
	const router = useRouter();
	const { t } = useTranslation("player");
	const [selectedSubtitle, setSubtitle] = useAtom(subtitleAtom);
	const { subtitle, ...queryWithoutSubs } = router.query;

	return (
		<Menu
			id="subtitle-menu"
			MenuListProps={{
				"aria-labelledby": "subtitle",
			}}
			anchorEl={anchor}
			open={!!anchor}
			onClose={onClose}
			anchorOrigin={{
				vertical: "top",
				horizontal: "center",
			}}
			transformOrigin={{
				vertical: "bottom",
				horizontal: "center",
			}}
		>
			<MenuItem
				selected={!selectedSubtitle}
				onClick={() => {
					setSubtitle(null);
					onClose();
				}}
				component={Link}
				to={{ query: queryWithoutSubs }}
				shallow
				replace
			>
				<ListItemText>{t("subtitle-none")}</ListItemText>
			</MenuItem>
			{subtitles.map((sub) => (
				<MenuItem
					key={sub.id}
					selected={selectedSubtitle?.id === sub.id}
					onClick={() => {
						setSubtitle({ track: sub, fonts });
						onClose();
					}}
					component={Link}
					to={{ query: { ...router.query, subtitle: sub.language ?? sub.id } }}
					shallow
					replace
				>
					<ListItemText>{sub.displayName}</ListItemText>
				</MenuItem>
			))}
		</Menu>
	);
};
