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
import { Theme, ThemeProvider } from "yoshiki";
import { useTheme, useYoshiki } from "yoshiki/native";
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
	overlay0: Property.Color;
	overlay1: Property.Color;
	variant: Variant;
	colors: {
		red: Property.Color;
		green: Property.Color;
		blue: Property.Color;
		yellow: Property.Color;
		white: Property.Color;
		black: Property.Color;
	};
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
	export interface Theme extends ThemeSettings, Mode, Variant {
		builder: ThemeBuilder;
	}
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
	return { ...options, ...modeOpt, ...def, variant: value.variant, builder: theme };
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

export const ThemeSelector = ({ children }: { children: ReactNode }) => {
	return <ThemeProvider theme={selectMode(catppuccin, "light")}>{children}</ThemeProvider>;
};

type YoshikiFunc<T> = (props: ReturnType<typeof useYoshiki>) => T;

const YoshikiProvider = ({ children }: { children: YoshikiFunc<ReactNode> }) => {
	const yoshiki = useYoshiki();
	return <>{children(yoshiki)}</>;
};

export const SwitchVariant = ({ children }: { children: ReactNode | YoshikiFunc<ReactNode> }) => {
	const theme = useTheme();

	return (
		<ThemeProvider theme={switchVariant(theme)}>
			{typeof children === "function" ? <YoshikiProvider>{children}</YoshikiProvider> : children}
		</ThemeProvider>
	);
};

export const ContrastArea = ({
	children,
	mode = "dark",
	contrastText,
}: {
	children: ReactNode | YoshikiFunc<ReactNode>;
	mode?: "light" | "dark";
	contrastText?: boolean;
}) => {
	const oldTheme = useTheme();
	const theme = selectMode(oldTheme.builder, mode);

	return (
		<ThemeProvider
			theme={
				contrastText
					? {
							...theme,
							heading: mode === "light" ? theme.colors.black : theme.colors.white,
							paragraph: theme.heading,
					  }
					: theme
			}
		>
			{typeof children === "function" ? <YoshikiProvider>{children}</YoshikiProvider> : children}
		</ThemeProvider>
	);
};

export const alpha = (color: Property.Color, alpha: number) => {
	return color + (alpha * 255).toString(16);
};
