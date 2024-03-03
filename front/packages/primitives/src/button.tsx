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

import { ComponentProps, ReactElement, forwardRef } from "react";
import { Theme, useYoshiki } from "yoshiki/native";
import { PressableFeedback } from "./links";
import { P } from "./text";
import { ts } from "./utils";
import { Falsy, View } from "react-native";

export const Button = forwardRef<
	View,
	{
		children?: ReactElement | Falsy;
		text?: string;
		licon?: ReactElement | Falsy;
		icon?: ReactElement | Falsy;
	} & ComponentProps<typeof PressableFeedback>
>(function Button({ children, text, icon, licon, ...props }, ref) {
	const { css } = useYoshiki("button");

	return (
		<PressableFeedback
			ref={ref}
			{...css(
				{
					flexGrow: 0,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					overflow: "hidden",
					p: ts(0.5),
					borderRadius: ts(5),
					borderColor: (theme) => theme.accent,
					borderWidth: ts(0.5),
					fover: {
						self: { bg: (theme: Theme) => theme.accent },
						text: { color: (theme: Theme) => theme.colors.white },
					},
				},
				props as any,
			)}
		>
			{(licon || text || icon) != null && (
				<View
					{...css({
						paddingX: ts(3),
						flexDirection: "row",
						alignItems: "center",
					})}
				>
					{licon}
					{text && <P {...css({ textAlign: "center" }, "text")}>{text}</P>}
					{icon}
				</View>
			)}
			{children}
		</PressableFeedback>
	);
});
