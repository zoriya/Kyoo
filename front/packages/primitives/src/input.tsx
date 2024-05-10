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

import { forwardRef, type ReactNode, useState } from "react";
import { TextInput, type TextInputProps, View, type ViewStyle } from "react-native";
import { px, type Theme, useYoshiki } from "yoshiki/native";
import { focusReset, ts } from "./utils";
import type { YoshikiEnhanced } from "./image/base-image";

export const Input = forwardRef<
	TextInput,
	{
		variant?: "small" | "big";
		right?: ReactNode;
		containerStyle?: YoshikiEnhanced<ViewStyle>;
	} & TextInputProps
>(function Input(
	{ placeholderTextColor, variant = "small", right, containerStyle, ...props },
	ref,
) {
	const [focused, setFocused] = useState(false);
	const { css, theme } = useYoshiki();

	return (
		<View
			{...css([
				{
					borderColor: (theme) => theme.accent,
					borderRadius: ts(1),
					borderWidth: px(1),
					borderStyle: "solid",
					padding: ts(0.5),
					flexDirection: "row",
					alignContent: "center",
					alignItems: "center",
				},
				variant === "big" && {
					borderRadius: ts(4),
					p: ts(1),
				},
				focused && {
					borderWidth: px(2),
				},
				containerStyle,
			])}
		>
			<TextInput
				ref={ref}
				placeholderTextColor={placeholderTextColor ?? theme.paragraph}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				{...css(
					{
						flexGrow: 1,
						color: (theme: Theme) => theme.paragraph,
						borderWidth: 0,
						...focusReset,
					},
					props,
				)}
			/>
			{right}
		</View>
	);
});
