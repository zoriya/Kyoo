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
import { View } from "react-native";
import FImage from "react-native-fast-image";

export const FastImage = ({
	src,
	alt,
	width,
	height,
	x,
	y,
	rows,
	columns,
	style,
	...props
}: {
	src: string;
	alt: string;
	width: number | string;
	height: number | string;
	x: number;
	y: number;
	rows: number;
	columns: number;
	style?: object;
}) => {
	return (
		<View style={{ width, height, overflow: "hidden", flexGrow: 0, flexShrink: 0 }}>
			<FImage
				source={{
					uri: src,
					priority: FImage.priority.low,
				}}
				accessibilityLabel={alt}
				resizeMode={FImage.resizeMode.cover}
				style={[
					{
						width: width * columns,
						height: height * rows,
						transform: `translate(${-x}px, ${-y}px)`,
					},
					style,
				]}
				{...props}
			/>
		</View>
	);
};
