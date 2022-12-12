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
import { ComponentProps, ComponentType } from "react";
import { PressableProps } from "react-native";
import { Pressable, px, useYoshiki } from "yoshiki/native";
import { Breakpoint, ts } from ".";

export type IconProps = {
	icon: ComponentProps<typeof MIcon>["name"];
	size?: number;
	color?: Breakpoint<string>;
};

export const Icon = ({ icon, size = 24, color }: IconProps) => {
	const { css, theme } = useYoshiki();
	return (
		<MIcon
			name={icon}
			size={size}
			{...css({ color: color ?? theme.colors.white, width: size, height: size })}
		/>
	);
};

export const IconButton = <AsProps = PressableProps,>({
	icon,
	size,
	color,
	as,
	...asProps
}: IconProps & { as?: ComponentType<AsProps> } & AsProps) => {
	const { css } = useYoshiki();

	const Container = as ?? Pressable;

	return (
		<Container
			{...(css(
				{
					p: ts(1),
					m: px(2),
					borderRadius: 9999,
				},
				asProps,
			) as AsProps)}
		>
			<Icon icon={icon} size={size} color={color} />
		</Container>
	);
};

export const IconFab = <AsProps = PressableProps,>(
	props: ComponentProps<typeof IconButton<AsProps>>,
) => {
	const { css, theme } = useYoshiki();

	return (
		<IconButton
			colors={theme.colors.black}
			{...(css(
				{
					bg: (theme) => theme.accent,
				},
				props,
			) as any)}
		/>
	);
};
