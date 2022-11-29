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

import { ReactNode } from "react";
import { TextProps } from "react-native";
import { TextLink } from "solito/link";
import { useYoshiki } from "yoshiki/native";

export const A = ({
	href,
	children,
	...props
}: TextProps & { href: string; children: ReactNode }) => {
	const { css, theme } = useYoshiki();

	return (
		<TextLink
			href={href}
			textProps={css(
				{
					fontFamily: theme.fonts.paragraph,
					color: theme.paragraph,
				},
				props,
			)}
		>
			{children}
		</TextLink>
	);
};
