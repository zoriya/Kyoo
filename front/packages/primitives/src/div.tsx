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

import { splitRender } from "yoshiki";
import { View } from "react-native";
import { ReactNode } from "react";

export const Div = splitRender<HTMLDivElement, View, { children: ReactNode }>(
	function _DivWeb(props, ref) {
		return <div ref={ref} {...props}></div>;
	},
	function _DivNat(props, ref) {
		return <View ref={ref} {...props}></View>;
	},
);
