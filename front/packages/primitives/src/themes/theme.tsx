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
import { Property } from "csstype";
import { Theme, ThemeProvider, useTheme } from "yoshiki";
import "yoshiki";
import { catppuccin } from "./catppuccin";

type ThemeSettings = {
	fonts: {
		heading: string;
		paragraph: string;
	};
};

type Mode = {
	appbar: Property.Color;
	/*
	 * The color used in texts or button that are hover black shades on images (ShowHeader, player...)
	 */
	contrast: Property.Color;
	subcontrast: Property.Color;
	variant: Variant;
	colors: {
		red: Property.Color,
		green: Property.Color,
		blue: Property.Color,
		yellow: Property.Color,
		white: Property.Color,
		black: Property.Color,
	}
};

type Variant = {
	background: Property.Color;
	accent: Property.Color;
	divider: Property.Color;
	heading: Property.Color;
	paragraph: Property.Color;
	subtext: Property.Color;
};

declare module "yoshiki" {
	// TODO: Add specifics colors
	export interface Theme extends ThemeSettings, Mode, Variant {}
}

export type { Theme } from "yoshiki";
export type ThemeBuilder = ThemeSettings & {
	light: Mode & { default: Variant };
	dark: Mode & { default: Variant };
};

export const selectMode = (theme: ThemeBuilder, mode: "light" | "dark"): Theme => {
	const { light, dark, ...options } = theme;
	const value = mode === "light" ? light : dark;
	const { default: def, ...modeOpt } = value;
	return { ...options, ...modeOpt, ...def, variant: value.variant };
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

export const ThemeSelector = ({ children }: { children: ReactNode }) => {
	return <ThemeProvider theme={selectMode(catppuccin, "light")}>{children}</ThemeProvider>;
};
