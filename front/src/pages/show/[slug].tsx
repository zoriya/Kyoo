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

import {
	Box,
	Skeleton,
	SxProps,
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import useTranslation from "next-translate/useTranslation";
import Head from "next/head";
import { Episode, EpisodeP, Season, Show, ShowP } from "~/models";
import { QueryIdentifier, QueryPage, useFetch, useInfiniteFetch } from "~/utils/query";
import { withRoute } from "~/utils/router";
import { Container } from "~/components/container";
import { makeTitle } from "~/utils/utils";
import { Link } from "~/utils/link";
import { ErrorComponent, ErrorPage } from "~/components/errors";
import { useState } from "react";
import { EpisodeLine } from "~/components/episode";
import InfiniteScroll from "react-infinite-scroll-component";
import { useRouter } from "next/router";
import { ShowHeader, ShowStaff } from "../movie/[slug]";


const EpisodeGrid = ({ slug, season }: { slug: string; season: number }) => {
	const { data, isError, error, hasNextPage, fetchNextPage } = useInfiniteFetch(
		EpisodeGrid.query(slug, season),
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

EpisodeGrid.query = (slug: string, season: string | number): QueryIdentifier<Episode> => ({
	parser: EpisodeP,
	path: ["shows", slug, "episode"],
	params: {
		seasonNumber: season,
	},
	infinite: true,
});


const SeasonTab = ({ slug, seasons, sx }: { slug: string; seasons?: Season[]; sx?: SxProps }) => {
	const router = useRouter();
	const seasonQuery = typeof router.query.season === "string" ? parseInt(router.query.season) : NaN;
	const [season, setSeason] = useState(isNaN(seasonQuery) ? 1 : seasonQuery);

	// TODO: handle absolute number only shows (without seasons)
	return (
		<Container sx={sx}>
			<Box sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}>
				<Tabs value={season} onChange={(_, i) => setSeason(i)} aria-label="List of seasons">
					{seasons
						? seasons.map((x) => (
								<Tab
									key={x.seasonNumber}
									label={x.name}
									value={x.seasonNumber}
									component={Link}
									to={`/show/${slug}?season=${x.seasonNumber}`}
									shallow
								/>
						  ))
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

ShowDetails.getFetchUrls = ({ slug, season = 1 }) => [
	query(slug),
	ShowStaff.query(slug),
	EpisodeGrid.query(slug, season),
];

export default withRoute(ShowDetails);
