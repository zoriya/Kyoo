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

import { TextStyle, View } from "react-native";
import { Image } from "./image";
import { useYoshiki, px, Stylable } from "yoshiki/native";
import { Icon } from "./icons";
import AccountCircle from "@material-symbols/svg-400/rounded/account_circle-fill.svg";
import { YoshikiStyle } from "yoshiki/dist/type";
import { P } from "@expo/html-elements";
import { forwardRef } from "react";
import { ts } from "./utils";

const stringToColor = (string: string) => {
	let hash = 0;
	let i;

	for (i = 0; i < string.length; i += 1) {
		hash = string.charCodeAt(i) + ((hash << 5) - hash);
	}

	let color = "#";
	for (i = 0; i < 3; i += 1) {
		const value = (hash >> (i * 8)) & 0xff;
		color += `00${value.toString(16)}`.slice(-2);
	}
	return color;
};

export const Avatar = forwardRef<
	View,
	{
		src?: string | null;
		alt?: string;
		size?: YoshikiStyle<number | string>;
		placeholder?: string;
		color?: string;
		isLoading?: boolean;
		fill?: boolean;
	} & Stylable
>(function _Avatar(
	{ src, alt, size = px(24), color, placeholder, isLoading = false, fill = false, ...props },
	ref,
) {
	const { css, theme } = useYoshiki();
	const col = color ?? theme.overlay0;

	// TODO: Support dark themes when fill === true
	return (
		<View
			ref={ref}
			{...css(
				[
					{
						borderRadius: 999999,
						overflow: "hidden",
						p: ts(1),
					},
					fill && {
						bg: col,
					},
					placeholder &&
					!src &&
					!isLoading && {
						bg: stringToColor(placeholder),
					},
				],
				props,
			)}
		>
			{src || isLoading ? (
				<Image src={src} alt={alt} layout={{ width: size, height: size }} />
			) : placeholder ? (
				<P
					{...css({
						marginVertical: 0,
						height: size,
						width: size,
						lineHeight: size,
						textAlign: "center",
					})}
				>
					{placeholder[0]}
				</P>
			) : (
				<Icon icon={AccountCircle} size={size} color={fill ? col : theme.colors.white} />
			)}
		</View>
	);
});
