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

import { ComponentProps } from "react";
import { Theme, useYoshiki } from "yoshiki/native";
import { PressableFeedback } from "./links";
import { P } from "./text";
import { ts } from "./utils";

export const Button = ({
	text,
	...props
}: { text: string } & ComponentProps<typeof PressableFeedback>) => {
	const { css } = useYoshiki();

	return (
		<PressableFeedback
			{...css(
				{
					flexGrow: 0,
					p: ts(0.5),
					borderRadius: ts(5),
					borderColor: (theme) => theme.accent,
					borderWidth: ts(0.5),
					fover: {
						self: { bg: (theme: Theme) => theme.accent },
						text: { color: (theme: Theme) => theme.colors.white },
					},
				},
				// @ts-ignore ??
				props,
			)}
		>
			<P {...css({ textAlign: "center" }, "text")}>{text}</P>
		</PressableFeedback>
	);
};
