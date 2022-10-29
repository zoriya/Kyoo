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

import { Property } from "csstype";
import "@emotion/react";
import { Theme, ThemeProvider, useTheme } from "@emotion/react";

type ThemeSettings = {
	fonts: {
		heading: string;
		paragraph: string;
	};
};

type Mode = Variant & {
	appbar: Property.Color;
	/*
	 * The color used in texts or button that are hover black shades on images (ShowHeader, player...)
	 */
	contrast: Property.Color;
	subcontrast: Property.Color;
	variant: Variant;
};

type Variant = {
	background: Property.Color;
	accent: Property.Color;
	divider: Property.Color;
	heading: Property.Color;
	paragraph: Property.Color;
	subtext: Property.Color;
};

declare module "@emotion/react" {
	// TODO: Add specifics colors
	export interface Theme extends ThemeSettings, Mode {}
}

export type { Theme } from "@emotion/react";
export type ThemeBuilder = ThemeSettings & {
	light: Mode;
	dark: Mode;
};

export const selectMode = (theme: ThemeBuilder, mode: "light" | "dark"): Theme => {
	const value = (mode === "light" ? theme.light : theme.dark);
	return { fonts: theme.fonts, ...(value.default), variant: value.variant };
};

export const switchVariant = (theme: Theme) => {
	return {
		...theme,
		...theme.variant,
		variant: {
			background: theme.background,
			accent: theme.accent,
			divider: theme.divider,
			heading: theme.heading,
			paragraph: theme.paragraph,
			subtext: theme.subtext,
		},
	};
};

export const SwitchVariant = ({ children }: { children?: JSX.Element | JSX.Element[] }) => {
	const theme = useTheme();

	return <ThemeProvider theme={switchVariant(theme)}>{children}</ThemeProvider>;
};
