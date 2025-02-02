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

import NextHead from "next/head";

export const Head = ({
	title,
	description,
	image,
}: {
	title?: string | null;
	description?: string | null;
	image?: string | null;
}) => {
	return (
		<NextHead>
			{title && <title>{`${title} - Kyoo`}</title>}
			{description && <meta name="description" content={description} />}
			{image && <meta property="og:image" content={image} />}
		</NextHead>
	);
};
