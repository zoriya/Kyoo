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

import { Box, Typography } from "@mui/material";
import { Image, Poster } from "~/components/poster";
import { Show } from "~/models";
import { QueryPage, useFetch } from "~/utils/query";
import { withRoute } from "~/utils/router";

const ShowHeader = (data: Show) => {
	return (
		<>
			<Image img={data.thumbnail} alt="" height="60vh" width="100%" sx={{ positon: "relative" }} />
			<Poster img={data.poster} alt={`${data.name}`} />
			<Typography variant="h1" component="h1">
				{data.name}
			</Typography>
		</>
	);
};

const ShowDetails: QueryPage<{ slug: string }> = ({ slug }) => {
	const { data } = useFetch<Show>("shows", slug);

	if (!data) return <p>oups</p>;

	return (
		<>
			<ShowHeader {...data} />
		</>
	);
};

ShowDetails.getFetchUrls = ({ slug }) => [["shows", slug]];

export default withRoute(ShowDetails);
