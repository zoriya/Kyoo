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

import { forwardRef, ReactNode, useState } from "react";
import { Platform, TextInput, TextInputProps, View } from "react-native";
import { px, Theme, useYoshiki } from "yoshiki/native";
import { focusReset, ts } from "./utils";

export const Input = forwardRef<
	TextInput,
	{
		variant?: "small" | "big";
		right?: ReactNode;
	} & TextInputProps
>(function Input({ placeholderTextColor, variant = "small", right, ...props }, ref) {
	const { css, theme } = useYoshiki();
	const [focused, setFocused] = useState(false);

	return (
		<View
			{...css(
				[
					{
						borderColor: (theme) => theme.colors.white,
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
				],
				props,
			)}
		>
			<TextInput
				ref={ref}
				placeholderTextColor={placeholderTextColor ?? theme.colors.white}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				{...css(
					{ flexGrow: 1, color: (theme: Theme) => theme.colors.white, borderWidth: 0, ...focusReset },
					props,
				)}
			/>
			{right}
		</View>
	);
});
