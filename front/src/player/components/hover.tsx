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

import { ArrowBack } from "@mui/icons-material";
import {
	Box,
	BoxProps,
	CircularProgress,
	IconButton,
	Skeleton,
	Tooltip,
	Typography,
} from "@mui/material";
import useTranslation from "next-translate/useTranslation";
import NextLink from "next/link";
import { Poster } from "~/components/poster";
import { WatchItem } from "~/models/resources/watch-item";
import { loadAtom } from "../state";
import { episodeDisplayNumber } from "~/components/episode";
import { LeftButtons } from "./left-buttons";
import { RightButtons } from "./right-buttons";
import { ProgressBar } from "./progress-bar";
import { useAtomValue } from "jotai";

export const Hover = ({
	data,
	onMenuOpen,
	onMenuClose,
	...props
}: { data?: WatchItem; onMenuOpen: () => void; onMenuClose: () => void } & BoxProps) => {
	const name = data
		? data.isMovie
			? data.name
			: `${episodeDisplayNumber(data, "")} ${data.name}`
		: undefined;

	return (
		<Box {...props}>
			<Back
				name={data?.name}
				href={data ? (data.isMovie ? `/movie/${data.slug}` : `/show/${data.showSlug}`) : "#"}
			/>
			<Box
				sx={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					background: "rgba(0, 0, 0, 0.6)",
					display: "flex",
					padding: "1%",
				}}
			>
				<VideoPoster poster={data?.poster} />
				<Box sx={{ width: "100%", ml: { xs: 0.5, sm: 3 }, display: "flex", flexDirection: "column" }}>
					<Typography variant="h4" component="h2" color="white" sx={{ pb: 1 }}>
						{name ?? <Skeleton />}
					</Typography>

					<ProgressBar chapters={data?.chapters} />

					<Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
						<LeftButtons
							previousSlug={data && !data.isMovie ? data.previousEpisode?.slug : undefined}
							nextSlug={data && !data.isMovie ? data.nextEpisode?.slug : undefined}
						/>
						<RightButtons subtitles={data?.subtitles} fonts={data?.fonts} onMenuOpen={onMenuOpen} onMenuClose={onMenuClose} />
					</Box>
				</Box>
			</Box>
		</Box>
	);
};
export const Back = ({ name, href }: { name?: string; href: string }) => {
	const { t } = useTranslation("player");

	return (
		<Box
			sx={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				background: "rgba(0, 0, 0, 0.6)",
				display: "flex",
				p: "0.33%",
				color: "white",
			}}
		>
			<Tooltip title={t("back")}>
				<NextLink href={href} passHref>
					<IconButton aria-label={t("back")} sx={{ color: "white" }}>
						<ArrowBack />
					</IconButton>
				</NextLink>
			</Tooltip>
			<Typography component="h1" variant="h5" sx={{ alignSelf: "center", ml: "1rem" }}>
				{name ? name : <Skeleton />}
			</Typography>
		</Box>
	);
};

const VideoPoster = ({ poster }: { poster?: string | null }) => {
	return (
		<Box
			sx={{
				width: "15%",
				display: { xs: "none", sm: "block" },
				position: "relative",
			}}
		>
			<Poster img={poster} width="100%" sx={{ position: "absolute", bottom: 0 }} />
		</Box>
	);
};

export const LoadingIndicator = () => {
	const isLoading = useAtomValue(loadAtom);
	if (!isLoading) return null;
	return (
		<Box
			sx={{
				position: "absolute",
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				background: "rgba(0, 0, 0, 0.3)",
				display: "flex",
				justifyContent: "center",
			}}
		>
			<CircularProgress thickness={5} sx={{ color: "white", alignSelf: "center" }} />
		</Box>
	);
};
