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

import { ArrowLeft, ArrowRight, LocalMovies, PlayArrow } from "@mui/icons-material";
import {
	alpha,
	Box,
	Divider,
	Fab,
	IconButton,
	Skeleton,
	SxProps,
	Tab,
	Tabs,
	Tooltip,
	Typography,
	useTheme,
} from "@mui/material";
import useTranslation from "next-translate/useTranslation";
import Head from "next/head";
import { Navbar } from "~/components/navbar";
import { Image, Poster } from "~/components/poster";
import { Episode, EpisodeP, Page, Season, Show, ShowP } from "~/models";
import { QueryIdentifier, QueryPage, useFetch, useInfiniteFetch } from "~/utils/query";
import { getDisplayDate } from "~/models/utils";
import { useScroll } from "~/utils/hooks/use-scroll";
import { withRoute } from "~/utils/router";
import { Container, containerPadding } from "~/components/container";
import { makeTitle } from "~/utils/utils";
import { Link } from "~/utils/link";
import { Studio } from "~/models/resources/studio";
import { Paged, Person, PersonP } from "~/models";
import { PersonAvatar } from "~/components/person";
import { ErrorComponent, ErrorPage } from "~/components/errors";
import { useState } from "react";
import { EpisodeBox, EpisodeLine } from "~/components/episode";
import InfiniteScroll from "react-infinite-scroll-component";

const StudioText = ({
	studio,
	loading = false,
	sx,
}: {
	studio?: Studio | null;
	loading?: boolean;
	sx?: SxProps;
}) => {
	const { t } = useTranslation("browse");

	if (!loading && !studio) return null;
	return (
		<Typography sx={sx}>
			{t("show.studio")}:{" "}
			{loading ? (
				<Skeleton width="5rem" sx={{ display: "inline-flex" }} />
			) : (
				<Link href={`/studio/${studio!.slug}`}>{studio!.name}</Link>
			)}
		</Typography>
	);
};

const ShowHeader = ({ data }: { data?: Show }) => {
	/* const scroll = useScroll(); */
	const { t } = useTranslation("browse");
	// TODO: tweek the navbar color with the theme.

	return (
		<>
			{/* TODO: Add a shadow on navbar items */}
			{/* TODO: Put the navbar outside of the scrollbox */}
			<Navbar
				position="fixed"
				elevation={0}
				sx={{ backgroundColor: `rgba(0, 0, 0, ${0.4 /*+ scroll / 1000*/})` }}
			/>
			<Image
				img={data?.thumbnail}
				alt=""
				loading={!data}
				width="100%"
				height={{ xs: "40vh", sm: "60vh", lg: "70vh" }}
				sx={{
					minHeight: { xs: "350px", sm: "400px", lg: "550px" },
					position: "relative",
					"&::after": {
						content: '""',
						position: "absolute",
						top: 0,
						bottom: 0,
						right: 0,
						left: 0,
						background: "linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.6) 100%)",
					},
				}}
			/>

			<Container
				sx={{
					position: "relative",
					marginTop: { xs: "-30%", sm: "-25%", md: "-15rem", lg: "-21rem", xl: "-23rem" },
					display: "flex",
					flexDirection: { xs: "column", sm: "row" },
					alignItems: { xs: "center", sm: "unset" },
					textAlign: { xs: "center", sm: "unset" },
				}}
			>
				<Poster
					img={data?.poster}
					alt={data?.name ?? ""}
					loading={!data}
					width={{ xs: "50%", md: "25%" }}
					sx={{ maxWidth: { xs: "175px", sm: "unset" }, flexShrink: 0 }}
				/>
				<Box sx={{ alignSelf: { xs: "center", sm: "end", md: "center" }, pl: { sm: "2.5rem" } }}>
					<Typography
						variant="h3"
						component="h1"
						sx={{
							color: { md: "white" },
							fontWeight: { md: 900 },
							mb: ".5rem",
						}}
					>
						{data?.name ?? <Skeleton width="15rem" />}
					</Typography>
					{(!data || data.startAir) && (
						<Typography variant="h5" sx={{ color: { md: "white" }, fontWeight: 300, mb: ".5rem" }}>
							{data != undefined ? (
								getDisplayDate(data.startAir!, data.endAir)
							) : (
								<Skeleton width="5rem" sx={{ mx: { xs: "auto", sm: "unset" } }} />
							)}
						</Typography>
					)}
					<Box sx={{ "& > *": { m: ".3rem !important" } }}>
						<Tooltip title={t("show.play")}>
							<Fab color="primary" size="small" aria-label={t("show.play")}>
								<PlayArrow />
							</Fab>
						</Tooltip>
						<Tooltip title={t("show.trailer")} aria-label={t("show.trailer")}>
							<IconButton>
								<LocalMovies sx={{ color: { md: "white" } }} />
							</IconButton>
						</Tooltip>
					</Box>
				</Box>
				<Box
					sx={{
						display: { xs: "none", md: "flex" },
						position: "absolute",
						right: 0,
						top: 0,
						bottom: 0,
						width: "25%",
						flexDirection: "column",
						alignSelf: "end",
						pr: "15px",
					}}
				>
					{data?.logo && (
						<Image
							img={data.logo}
							alt=""
							width="100%"
							height="100px"
							sx={{ display: { xs: "none", lg: "unset" } }}
						/>
					)}
					<StudioText loading={!data} studio={data?.studio} sx={{ mt: "auto", mb: 3 }} />
				</Box>
			</Container>

			<Container sx={{ display: { xs: "block", sm: "none" }, pt: 3 }}>
				<StudioText loading={!data} studio={data?.studio} sx={{ mb: 1 }} />
				<Typography sx={{ mb: 1 }}>
					{t("show.genre")}
					{": "}
					{!data ? (
						<Skeleton width="10rem" sx={{ display: "inline-flex" }} />
					) : data?.genres && data.genres.length ? (
						data.genres.map((genre, i) => [
							i > 0 && ", ",
							<Link key={genre.id} href={`/genres/${genre.slug}`}>
								{genre.name}
							</Link>,
						])
					) : (
						t("show.genre-none")
					)}
				</Typography>
			</Container>

			<Container sx={{ pt: 2 }}>
				<Typography align="justify" sx={{ flexBasis: 0, flexGrow: 1, pt: { sm: 2 } }}>
					{data
						? data.overview ?? t("show.noOverview")
						: [...Array(4)].map((_, i) => <Skeleton key={i} />)}
				</Typography>
				<Divider
					orientation="vertical"
					variant="middle"
					flexItem
					sx={{ mx: 2, display: { xs: "none", sm: "block" } }}
				/>
				<Box sx={{ flexBasis: "25%", display: { xs: "none", sm: "block" } }}>
					<StudioText
						loading={!data}
						studio={data?.studio}
						sx={{ display: { xs: "none", sm: "block", md: "none" }, pb: 2 }}
					/>

					<Typography variant="h4" component="h2">
						{t("show.genre")}
					</Typography>
					{!data || data.genres?.length ? (
						<ul>
							{(data ? data.genres! : [...Array(3)]).map((genre, i) => (
								<li key={genre?.id ?? i}>
									<Typography>
										{genre ? (
											<Link href={`/genres/${genre.slug}`}>{genre.name}</Link>
										) : (
											<Skeleton />
										)}
									</Typography>
								</li>
							))}
						</ul>
					) : (
						<Typography>{t("show.genre-none")}</Typography>
					)}
				</Box>
			</Container>
		</>
	);
};

const staffQuery = (slug: string): QueryIdentifier<Person> => ({
	parser: PersonP,
	path: ["shows", slug, "people"],
	infinite: true,
});

const ShowStaff = ({ slug }: { slug: string }) => {
	const { data, isError, error, hasNextPage, fetchNextPage } = useInfiniteFetch(staffQuery(slug));
	const { t } = useTranslation("browse");

	// TODO: handle infinite scroll

	if (isError) return <ErrorComponent {...error} />;

	return (
		<>
			<Container
				sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", py: 3 }}
			>
				<Typography variant="h4" component="h2">
					{t("show.staff")}
				</Typography>
				<Box>
					<IconButton>
						<ArrowLeft />
					</IconButton>
					<IconButton>
						<ArrowRight />
					</IconButton>
				</Box>
			</Container>
			{data && data?.pages.at(0)?.count === 0 ? (
				<Box sx={{ display: "flex", justifyContent: "center" }}>
					<Typography sx={{ py: 3 }}>{t("show.staff-none")}</Typography>
				</Box>
			) : (
				<Container
					sx={{
						display: "flex",
						flexDirection: "row",
						maxWidth: "100%",
						overflowY: "auto",
						pt: 1,
						pb: 2,
						overflowX: "visible",
					}}
				>
					{(data ? data.pages.flatMap((x) => x.items) : [...Array(20)]).map((x, i) => (
						<PersonAvatar
							key={x ? x.id : i}
							person={x}
							sx={{ width: { xs: "7rem", lg: "10rem" }, flexShrink: 0, px: 2 }}
						/>
					))}
				</Container>
			)}
		</>
	);
};

const episodesQuery = (slug: string, season: string | number): QueryIdentifier<Episode> => ({
	parser: EpisodeP,
	path: ["shows", slug, "episode"],
	params: {
		seasonNumber: season,
	},
	infinite: true,
});

const EpisodeGrid = ({ slug, season }: { slug: string; season: number }) => {
	const { data, isError, error, hasNextPage, fetchNextPage } = useInfiniteFetch(
		episodesQuery(slug, season),
	);
	const { t } = useTranslation("browse");

	if (isError) return <ErrorComponent {...error} />;

	if (data && data.pages.at(0)?.count === 0) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center" }}>
				<Typography sx={{ py: 3 }}>{t("show.episode-none")}</Typography>
			</Box>
		);
	}

	return (
		<InfiniteScroll
			dataLength={data?.pages.flatMap((x) => x.items).length ?? 0}
			next={fetchNextPage}
			hasMore={hasNextPage!}
			loader={[...Array(12)].map((_, i) => (
				<EpisodeLine key={i} />
			))}
		>
			{(data ? data.pages.flatMap((x) => x.items) : [...Array(12)]).map((x, i) => (
				<EpisodeLine key={x ? x.id : i} episode={x} />
			))}
		</InfiniteScroll>
	);
};

const SeasonTab = ({ slug, seasons, sx }: { slug: string; seasons?: Season[]; sx?: SxProps }) => {
	const [season, setSeason] = useState(1);

	// TODO: handle absolute number only shows (without seasons)
	return (
		<Container sx={sx}>
			<Box sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}>
				<Tabs value={season} onChange={(_, i) => setSeason(i)} aria-label="List of seasons">
					{seasons
						? seasons.map((x) => <Tab key={x.seasonNumber} label={x.name} value={x.seasonNumber} />)
						: [...Array(3)].map((_, i) => (
								<Tab key={i} label={<Skeleton width="5rem" />} value={i + 1} disabled />
						  ))}
				</Tabs>
				<EpisodeGrid slug={slug} season={season} />
			</Box>
		</Container>
	);
};

const query = (slug: string): QueryIdentifier<Show> => ({
	parser: ShowP,
	path: ["shows", slug],
	params: {
		fields: ["genres", "studio", "seasons"],
	},
});

const ShowDetails: QueryPage<{ slug: string }> = ({ slug }) => {
	const { data, error } = useFetch(query(slug));

	if (error) return <ErrorPage {...error} />;

	return (
		<>
			<Head>
				<title>{makeTitle(data?.name)}</title>
				<meta name="description" content={data?.overview!} />
			</Head>
			<ShowHeader data={data} />
			<ShowStaff slug={slug} />
			<SeasonTab slug={slug} seasons={data?.seasons} sx={{ pt: 3 }} />
		</>
	);
};

ShowDetails.getFetchUrls = ({ slug, seasonNumber = 1 }) => [
	query(slug),
	staffQuery(slug),
	episodesQuery(slug, seasonNumber),
];

export default withRoute(ShowDetails);
