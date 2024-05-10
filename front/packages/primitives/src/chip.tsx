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

import { px, rem, type Theme, useYoshiki } from "yoshiki/native";
import { Link } from "./links";
import { P } from "./text";
import { capitalize, ts } from "./utils";
import type { TextProps } from "react-native";
import { Skeleton } from "./skeleton";

export const Chip = ({
	color,
	size = "medium",
	outline = false,
	label,
	href,
	replace,
	target,
	textProps,
	...props
}: {
	color?: string;
	size?: "small" | "medium" | "large";
	outline?: boolean;
	label?: string;
	href?: string;
	replace?: boolean;
	target?: string;
	textProps?: TextProps;
}) => {
	const { css } = useYoshiki("chip");

	textProps ??= {};

	const sizeMult = size === "medium" ? 1 : size === "small" ? 0.5 : 1.5;

	return (
		<Link
			href={href}
			replace={replace}
			target={target}
			{...css(
				[
					{
						pY: ts(1 * sizeMult),
						pX: ts(2.5 * sizeMult),
						borderRadius: ts(3),
						overflow: "hidden",
					},
					outline && {
						borderColor: color ?? ((theme: Theme) => theme.accent),
						borderStyle: "solid",
						borderWidth: px(1),
						fover: {
							self: {
								bg: (theme: Theme) => theme.accent,
							},
							text: {
								color: (theme: Theme) => theme.alternate.contrast,
							},
						},
					},
					!outline && {
						bg: color ?? ((theme: Theme) => theme.accent),
					},
				],
				props,
			)}
		>
			<P
				{...css(
					[
						"text",
						{
							marginVertical: 0,
							fontSize: rem(0.8),
							color: (theme: Theme) => (outline ? theme.contrast : theme.alternate.contrast),
						},
					],
					textProps,
				)}
			>
				{label ? capitalize(label) : <Skeleton {...css({ width: rem(3) })} />}
			</P>
		</Link>
	);
};
