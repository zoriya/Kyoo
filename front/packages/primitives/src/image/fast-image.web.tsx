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

import NextImage from "next/image";

export const FastImage = ({
	src,
	alt,
	style,
	x,
	y,
	...props
}: {
	src: string;
	alt: string;
	style?: object;
	width: number | string;
	height: number | string;
	x: number;
	y: number;
}) => {
	return (
		<NextImage
			src={src}
			priority={false}
			alt={alt!}
			// Don't use next's server to reprocess images, they are already optimized by kyoo.
			unoptimized={true}
			style={{ objectFit: "none", objectPosition: `${-x}px ${-y}px`, ...style }}
			{...props}
		/>
	);
};
