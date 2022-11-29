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

import { ComponentType, ComponentProps } from "react";
import { TextProps } from "react-native";
import { useYoshiki } from "yoshiki/native";
import {
	H1 as EH1,
	H2 as EH2,
	H3 as EH3,
	H4 as EH4,
	H5 as EH5,
	H6 as EH6,
	P as EP,
} from "@expo/html-elements";

const styleText = (Component: ComponentType<ComponentProps<typeof EP>>, heading?: boolean) => {
	const Text = (props: ComponentProps<typeof EP>) => {
		const { css, theme } = useYoshiki();

		return (
			<Component
				{...css(
					{
						fontFamily: heading ? theme.fonts.heading : theme.fonts.paragraph,
						color: heading ? theme.heading : theme.paragraph,
					},
					props as TextProps,
				)}
			/>
		);
	};
	return Text;
};

export const H1 = styleText(EH1, true);
export const H2 = styleText(EH2, true);
export const H3 = styleText(EH3, true);
export const H4 = styleText(EH4, true);
export const H5 = styleText(EH5, true);
export const H6 = styleText(EH6, true);
export const P = styleText(EP);
