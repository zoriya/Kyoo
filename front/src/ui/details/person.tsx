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

import { Avatar, Link, P, Skeleton, SubP } from "@kyoo/primitives";
import { type Stylable, useYoshiki } from "yoshiki/native";

export const PersonAvatar = ({
	slug,
	name,
	role,
	poster,
	isLoading,
	...props
}: {
	isLoading: boolean;
	slug?: string;
	name?: string;
	role?: string;
	poster?: string | null;
} & Stylable) => {
	const { css } = useYoshiki();

	return (
		<Link href={slug ? `/person/${slug}` : ""} {...props}>
			<Avatar src={poster} alt={name} size={PersonAvatar.width} fill />
			<Skeleton>{isLoading || <P {...css({ textAlign: "center" })}>{name}</P>}</Skeleton>
			{(isLoading || role) && (
				<Skeleton>{isLoading || <SubP {...css({ textAlign: "center" })}>{role}</SubP>}</Skeleton>
			)}
		</Link>
	);
};

PersonAvatar.width = 300;
