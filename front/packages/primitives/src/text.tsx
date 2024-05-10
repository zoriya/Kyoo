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

import type { ComponentType, ComponentProps } from "react";
import { Platform, Text, type TextProps, type TextStyle, type StyleProp } from "react-native";
import { percent, rem, useYoshiki } from "yoshiki/native";
import {
	H1 as EH1,
	H2 as EH2,
	H3 as EH3,
	H4 as EH4,
	H5 as EH5,
	H6 as EH6,
	P as EP,
} from "@expo/html-elements";
import { ts } from "./utils/spacing";

const styleText = (
	Component: ComponentType<ComponentProps<typeof EP>>,
	type?: "header" | "sub",
	custom?: TextStyle,
) => {
	const Text = (
		props: Omit<ComponentProps<typeof EP>, "style"> & {
			style?: StyleProp<TextStyle>;
			children?: TextProps["children"];
		},
	) => {
		const { css, theme } = useYoshiki();

		return (
			<Component
				{...css(
					[
						{
							marginVertical: rem(0.5),
							color: type === "header" ? theme.heading : theme.paragraph,
							flexShrink: 1,
							fontSize: rem(1),
							fontFamily: theme.font.normal,
						},
						type === "sub" && {
							fontFamily: theme.font["300"] ?? theme.font.normal,
							fontWeight: "300",
							opacity: 0.8,
							fontSize: rem(0.8),
						},
						custom?.fontWeight && {
							fontFamily: theme.font[custom.fontWeight] ?? theme.font.normal,
						},
						custom,
					],
					props as TextProps,
				)}
			/>
		);
	};
	return Text;
};

export const H1 = styleText(EH1, "header", { fontSize: rem(3), fontWeight: "900" });
export const H2 = styleText(EH2, "header", { fontSize: rem(2) });
export const H3 = styleText(EH3, "header");
export const H4 = styleText(EH4, "header");
export const H5 = styleText(EH5, "header");
export const H6 = styleText(EH6, "header");
export const Heading = styleText(EP, "header");
export const P = styleText(EP, undefined, { fontSize: rem(1) });
export const SubP = styleText(EP, "sub");

export const LI = ({ children, ...props }: TextProps) => {
	const { css } = useYoshiki();

	return (
		<P role={Platform.OS === "web" ? "listitem" : props.role} {...props}>
			<Text
				{...css({
					height: percent(100),
					marginBottom: rem(0.5),
					paddingRight: ts(1),
				})}
			>
				{String.fromCharCode(0x2022)}
			</Text>
			{children}
		</P>
	);
};
