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

import { HR as EHR } from "@expo/html-elements";
import { px, Stylable, useYoshiki } from "yoshiki/native";
import { alpha } from "./themes";
import { ts } from "./utils";

export const HR = ({
	orientation,
	...props
}: { orientation: "vertical" | "horizontal" } & Stylable) => {
	const { css } = useYoshiki();

	return (
		<EHR
			{...css(
				[
					{
						bg: (theme) => alpha(theme.overlay0, 0.7),
						borderWidth: 0,
					},
					orientation === "vertical" && {
						width: px(1),
						height: "auto",
						marginVertical: ts(1),
						marginHorizontal: ts(2),
					},
					orientation === "horizontal" && {
						height: px(1),
						width: "auto",
						marginHorizontal: ts(1),
						marginVertical: ts(2),
					},
				],
				props,
			)}
		/>
	);
};
