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

import { ComponentProps, ComponentType, Fragment, ReactNode } from "react";
import {
	Platform,
	Pressable,
	TextProps,
	TouchableOpacity,
	TouchableNativeFeedback,
	View,
	ViewProps,
	StyleSheet,
    PressableProps,
} from "react-native";
import { LinkCore, TextLink } from "solito/link";
import { useYoshiki } from "yoshiki/native";

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

export const PressableFeedback = ({
	children,
	WebComponent,
	...props
}: ViewProps & {
	onFocus?: PressableProps["onFocus"];
	onBlur?: PressableProps["onBlur"];
	onPressIn?: PressableProps["onPressIn"];
	onPressOut?: PressableProps["onPressOut"];
	onPress?: PressableProps["onPress"];
	WebComponent?: ComponentType;
}) => {
	const { onBlur, onFocus, onPressIn, onPressOut, onPress, ...noPressProps } = props;
	const pressProps = { onBlur, onFocus, onPressIn, onPressOut, onPress };
	const radiusStyle = Platform.select<ViewProps>({
		android: {
			style: { borderRadius: StyleSheet.flatten(props?.style)?.borderRadius, overflow: "hidden" },
		},
		default: {},
	});
	const Wrapper = radiusStyle.style ? View : Fragment;
	const InnerPressable = Platform.select<ComponentType<{ children?: any }>>({
		web: WebComponent ?? Pressable,
		android: TouchableNativeFeedback,
		ios: TouchableOpacity,
		default: Pressable,
	});

	return (
		<Wrapper {...radiusStyle}>
			<InnerPressable
				{...Platform.select<object>({
					android: { useForeground: true, ...pressProps },
					default: props,
				})}
			>
				{Platform.select<ReactNode>({
					android: <View {...noPressProps}>{children}</View>,
					ios: <View {...noPressProps}>{children}</View>,
					default: children,
				})}
			</InnerPressable>
		</Wrapper>
	);
};

export const Link = ({
	href,
	children,
	...props
}: { href: string } & Omit<ComponentProps<typeof PressableFeedback>, "WebComponent">) => {
	return (
		<LinkCore
			href={href}
			Component={PressableFeedback}
			componentProps={{ WebComponent: View, ...props }}
		>
			{children}
		</LinkCore>
	);
};
