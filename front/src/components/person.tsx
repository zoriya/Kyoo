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

import { Avatar, Box, Skeleton, SxProps, Typography } from "@mui/material";
import { Person } from "~/models/resources/person";
import { Link } from "~/utils/link";

export const PersonAvatar = ({ person, sx }: { person?: Person; sx?: SxProps }) => {
	if (!person) {
		return (
			<Box sx={sx}>
				<Skeleton variant="circular" sx={{ width: "100%", aspectRatio: "1/1", height: "unset" }}/>
				<Typography align="center"><Skeleton/></Typography>
				<Typography variant="body2" align="center"><Skeleton/></Typography>
			</Box>
		)
	}
	return (
		<Link href={`/person/${person.slug}`} color="inherit" sx={sx}>
			<Avatar
				src={person.poster!}
				alt={person.name}
				sx={{ width: "100%", height: "unset", aspectRatio: "1/1" }}
			/>
			<Typography align="center">{person.name}</Typography>
			{person.role && person.type && (
				<Typography variant="body2" align="center">
					{person.type} ({person.role})
				</Typography>
			)}
			{person.role && !person.type && (
				<Typography variant="body2" align="center">
					{person.role}
				</Typography>
			)}
		</Link>
	);
};
