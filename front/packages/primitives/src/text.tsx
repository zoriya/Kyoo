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

import { forwardRef } from "react";
import { Platform, Text } from "react-native";

export const Heading = forwardRef<
	Text,
	{
		level: 1 | 2 | 3 | 4 | 5 | 6;
		children?: JSX.Element | JSX.Element[];
	}
>(function Heading({ level = 1, children, ...props }, ref) {
	const nativeProps: any = Platform.select({
		web: {
			"aria-level": level.toString(),
		},
		default: {},
	});

	return (
		<Text
			ref={ref}
			accessibilityRole="header"
			{...nativeProps}
			{...props}
			style={(theme) => ({
				font: theme.fonts.heading,
				color: theme.heading,
			})}
		>
			{children}
		</Text>
	);
});

export const Paragraph = forwardRef<
	Text,
	{
		variant: "normal" | "subtext";
		children?: string | JSX.Element | JSX.Element[];
	}
>(function Paragraph({ variant, children, ...props }, ref) {
	return (
		<Text
			ref={ref}
			{...props}
			css={{
				font: theme => theme.fonts.paragraph,
				color: theme => variant === "normal" ? theme.paragraph : theme.subtext,
			})}
		>
			{children}
		</Text>
	);
});
