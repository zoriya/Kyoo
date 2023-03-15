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

import { rem, Stylable, Theme, useYoshiki } from "yoshiki/native";
import { P } from "./text";
import { ts } from "./utils";

export const Chip = ({ label, color, ...props }: { label: string; color?: string } & Stylable) => {
	const { css } = useYoshiki();

	return (
		<P
			{...css(
				{
					pY: ts(1),
					pX: ts(1.5),
					borderRadius: ts(3),
					fontSize: rem(.8),
					color: (theme: Theme) => theme.contrast,
					bg: color ?? ((theme: Theme) => theme.accent),
				},
				props,
			)}
		>
			{label}
		</P>
	);
};
