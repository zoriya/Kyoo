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

import { ComponentType, Fragment, ReactNode } from "react";
import {
	Platform,
	TextProps,
	TouchableOpacity,
	TouchableNativeFeedback,
	View,
	ViewProps,
	StyleSheet,
} from "react-native";
import { LinkCore, TextLink } from "solito/link";
import { useYoshiki, Pressable } from "yoshiki/native";

export const A = ({
	href,
	children,
	...props
}: TextProps & { href: string; children: ReactNode }) => {
	const { css, theme } = useYoshiki();

	return (
		<TextLink
			href={href}
			textProps={css(
				{
					// TODO: use a real font here.
					// fontFamily: theme.fonts.paragraph,
					color: theme.link,
				},
				{
					selectable: true,
					...props,
				},
			)}
		>
			{children}
		</TextLink>
	);
};

export const Link = ({
	href,
	children,
	...props
}: ViewProps & {
	href: string;
	onFocus?: () => void;
	onBlur?: () => void;
	onPressIn?: () => void;
	onPressOut?: () => void;
}) => {
	const { onBlur, onFocus, onPressIn, onPressOut, ...noFocusProps } = props;
	const focusProps = { onBlur, onFocus, onPressIn, onPressOut };
	const radiusStyle = Platform.select<ViewProps>({
		android: {
			style: { borderRadius: StyleSheet.flatten(props?.style)?.borderRadius, overflow: "hidden" },
		},
		default: {},
	});
	const Wrapper = radiusStyle.style ? View : Fragment;

	return (
		<Wrapper {...radiusStyle}>
			<LinkCore
				href={href}
				Component={Platform.select<ComponentType>({
					web: View,
					android: TouchableNativeFeedback,
					ios: TouchableOpacity,
					default: Pressable,
				})}
				componentProps={Platform.select<object>({
					android: { useForeground: true, ...focusProps },
					default: props,
				})}
			>
				{Platform.select<ReactNode>({
					android: <View {...noFocusProps}>{children}</View>,
					ios: <View {...noFocusProps}>{children}</View>,
					default: children,
				})}
			</LinkCore>
		</Wrapper>
	);
};
