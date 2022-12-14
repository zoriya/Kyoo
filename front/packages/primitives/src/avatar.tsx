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

import { View } from "react-native";
import { Image } from "./image";
import { useYoshiki, px, Stylable } from "yoshiki/native";
import { Icon } from "./icons";
import AccountCircle from "@material-symbols/svg-400/rounded/account_circle-fill.svg";

export const Avatar = ({
	src,
	alt,
	size = px(24),
	color,
	isLoading = false,
	...props
}: {
	src?: string | null;
	alt?: string;
	size?: number;
	color?: string;
	isLoading?: boolean;
} & Stylable) => {
	const { css, theme } = useYoshiki();

	console.log(color)
	return (
		<View
			{...css({ borderRadius: size / 2, width: size, height: size, overflow: "hidden" }, props)}
		>
			{src || isLoading ? (
				<Image src={src} alt={alt} layout={{ width: size, height: size }} />
			) : (
				<Icon icon={AccountCircle} size={size} color={color ?? theme.overlay0} />
			)}
		</View>
	);
};
