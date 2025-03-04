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

import type { ComponentType } from "react";
import { View, type ViewProps } from "react-native";
import { percent, px, useYoshiki } from "yoshiki/native";

export const Container = <AsProps = ViewProps>({
	as,
	...props
}: { as?: ComponentType<AsProps> } & AsProps) => {
	const { css } = useYoshiki();

	const As = as ?? View;
	return (
		<As
			{...(css(
				{
					display: "flex",
					paddingHorizontal: px(15),
					alignSelf: "center",
					width: {
						xs: percent(100),
						sm: px(540),
						md: px(880),
						lg: px(1170),
					},
				},
				props,
			) as any)}
		/>
	);
};
