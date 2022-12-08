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

import { View } from "moti";
import { Skeleton as MSkeleton } from "moti/skeleton";
import { ComponentProps } from "react";
import { useYoshiki, rem, px, Stylable } from "yoshiki/native";

export const Skeleton = ({
	style,
	children,
	...props
}: Omit<ComponentProps<typeof MSkeleton>, "children"> & {
	children: ComponentProps<typeof MSkeleton>["children"] | boolean;
} & Stylable) => {
	const { css } = useYoshiki();
	return (
		<View {...css({ margin: px(2) }, { style })}>
			<MSkeleton colorMode="light" radius={6} height={rem(1.2)} {...props}>
				{children !== true ? children || undefined : undefined}
			</MSkeleton>
		</View>
	);
};
