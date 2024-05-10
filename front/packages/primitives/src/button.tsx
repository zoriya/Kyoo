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

import { type ComponentType, type ForwardedRef, type ReactElement, forwardRef } from "react";
import { type Theme, useYoshiki } from "yoshiki/native";
import { PressableFeedback } from "./links";
import { P } from "./text";
import { ts } from "./utils";
import { type Falsy, type PressableProps, View } from "react-native";

export const Button = forwardRef(function Button<AsProps = PressableProps>(
	{
		children,
		text,
		icon,
		licon,
		disabled,
		as,
		...props
	}: {
		children?: ReactElement | ReactElement[] | Falsy;
		text?: string;
		licon?: ReactElement | Falsy;
		icon?: ReactElement | Falsy;
		disabled?: boolean;
		as?: ComponentType<AsProps>;
	} & AsProps,
	ref: ForwardedRef<unknown>,
) {
	const { css } = useYoshiki("button");

	const Container = as ?? PressableFeedback;
	return (
		<Container
			ref={ref as any}
			disabled={disabled}
			{...(css(
				[
					{
						flexGrow: 0,
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						overflow: "hidden",
						p: ts(0.5),
						borderRadius: ts(5),
						borderColor: (theme: Theme) => theme.accent,
						borderWidth: ts(0.5),
						fover: {
							self: { bg: (theme: Theme) => theme.accent },
							text: { color: (theme: Theme) => theme.colors.white },
						},
					},
					disabled && {
						child: {
							self: {
								borderColor: (theme) => theme.overlay1,
							},
							text: {
								color: (theme) => theme.overlay1,
							},
						},
					},
				],
				props as any,
			) as AsProps)}
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
		</Container>
	);
});
