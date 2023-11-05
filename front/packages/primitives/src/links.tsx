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

import { forwardRef, ReactNode } from "react";
import { Platform, Pressable, TextProps, View, PressableProps } from "react-native";
import { TextLink, useLink } from "solito/link";
import { useTheme, useYoshiki } from "yoshiki/native";
import { alpha } from "./themes";
import { NextLink } from "solito/build/link/next-link";

export const A = ({
	href,
	replace,
	children,
	target,
	...props
}: TextProps & {
	href?: string | null;
	target?: string;
	replace?: boolean;
	children: ReactNode;
}) => {
	const { css, theme } = useYoshiki();

	return (
		<TextLink
			href={href ?? ""}
			target={target}
			replace={replace as any}
			experimental={
				replace
					? {
							nativeBehavior: "stack-replace",
							isNestedNavigator: false,
					  }
					: undefined
			}
			textProps={css(
				{
					fontFamily: theme.font.normal,
					color: theme.link,
				},
				{
					selectable: true,
					hrefAttrs: { target },
					...props,
				},
			)}
		>
			{children}
		</TextLink>
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
	target,
	children,
	...props
}: { href?: string | null; target?: string; replace?: boolean } & PressableProps) => {
	const linkProps = useLink({
		href: href ?? "#",
		replace,
		experimental: { nativeBehavior: "stack-replace", isNestedNavigator: false },
	});
	// @ts-ignore Missing hrefAttrs type definition.
	linkProps.hrefAttrs = { ...linkProps.hrefAttrs, target };
	return (
		<PressableFeedback {...linkProps} {...props}>
			{children}
		</PressableFeedback>
	);
};
