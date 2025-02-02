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

import type { ReactElement } from "react";
import { View } from "react-native";
import { Blurhash } from "react-native-blurhash";
import { type Stylable, useYoshiki } from "yoshiki/native";

export const BlurhashContainer = ({
	blurhash,
	children,
	...props
}: { blurhash: string; children?: ReactElement | ReactElement[] } & Stylable) => {
	const { css } = useYoshiki();

	return (
		<View {...props}>
			<Blurhash
				blurhash={blurhash}
				resizeMode="cover"
				{...css({ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 })}
			/>
			{children}
		</View>
	);
};
