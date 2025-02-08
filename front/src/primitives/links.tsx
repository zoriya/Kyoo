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

import { useLinkTo } from "one";
import { type ReactNode, forwardRef } from "react";
import {
	Platform,
	Pressable,
	type PressableProps,
	Text,
	type TextProps,
	type View,
} from "react-native";
import { useTheme, useYoshiki } from "yoshiki/native";
import { alpha } from "./theme";

export const A = ({
	href,
	replace,
	children,
	...props
}: TextProps & {
	href?: string | null;
	target?: string;
	replace?: boolean;
	children: ReactNode;
}) => {
	const { css, theme } = useYoshiki();
	const linkProps = useLinkTo({ href: href ?? "#", replace });

	return (
		<Text
			{...linkProps}
			{...css(
				{
					fontFamily: theme.font.normal,
					color: theme.link,
					userSelect: "text",
				},
				props,
			)}
		>
			{children}
		</Text>
	);
};

export const PressableFeedback = forwardRef<View, PressableProps>(function Feedback(
	{ children, ...props },
	ref,
) {
	const theme = useTheme();

	return (
		<Pressable
			ref={ref}
			// TODO: Enable ripple on tv. Waiting for https://github.com/react-native-tvos/react-native-tvos/issues/440
			{...(Platform.isTV
				? {}
				: { android_ripple: { foreground: true, color: alpha(theme.contrast, 0.5) as any } })}
			{...props}
		>
			{children}
		</Pressable>
	);
});

export const Link = ({
	href,
	replace,
	children,
	...props
}: {
	href?: string | null;
	replace?: boolean;
	download?: boolean;
	target?: string;
} & PressableProps) => {
	const linkProps = useLinkTo({ href: href ?? "#", replace });

	console.warn(children);
	return (
		<PressableFeedback
			{...linkProps}
			{...props}
			onPress={(e?: any) => {
				props?.onPress?.(e);
				if (e?.defaultPrevented) return;
				else linkProps.onPress(e);
			}}
		>
			{children}
		</PressableFeedback>
	);
};
