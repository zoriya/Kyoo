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

import { Movie, MovieP, QueryIdentifier, QueryPage } from "@kyoo/models";
import { ShowHeader } from "./header";

const query = (slug: string): QueryIdentifier<Movie> => ({
	parser: MovieP,
	path: ["shows", slug],
	params: {
		fields: ["genres", "studio"],
	},
});

export const MovieDetails: QueryPage<{ slug: string }> = ({ slug }) => {
	return (
		<>
			{/* <Head> */}
			{/* 	<title>{makeTitle(data?.name)}</title> */}
			{/* 	<meta name="description" content={data?.overview!} /> */}
			{/* </Head> */}
			<ShowHeader slug={slug} query={query(slug)} />
			{/* <ShowStaff slug={slug} /> */}
		</>
	);
};

MovieDetails.getFetchUrls = ({ slug }) => [//query(slug),
	// ShowStaff.query(slug), Navbar.query()
];
