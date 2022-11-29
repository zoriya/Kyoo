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

import MIcon from "@expo/vector-icons/MaterialIcons";
import { ComponentProps } from "react";
import { Pressable, useTheme } from "yoshiki/native";

export type IconProps = {
	icon: ComponentProps<typeof MIcon>["name"];
	size?: number;
	color?: string;
};

export const Icon = ({ icon, size, color }: IconProps) => {
	return <MIcon name={icon} size={size ?? 24} color={color} />;
};

export const IconButton = ({
	icon,
	size,
	color,
	...props
}: ComponentProps<typeof Pressable> & IconProps) => {
	return (
		<Pressable {...props}>
			<Icon icon={icon} size={size} color={color} />
		</Pressable>
	);
};
