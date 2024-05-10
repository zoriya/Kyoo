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
import { Theme, ThemeProvider, useAutomaticTheme } from "yoshiki";
import { useTheme, useYoshiki } from "yoshiki/native";
import "yoshiki";
import "yoshiki/native";
import { catppuccin } from "./catppuccin";
import { Platform } from "react-native";

type FontList = Partial<
	Record<
		"normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900",
		string
	>
>;

type Mode = {
	mode: "light" | "dark" | "auto";
	overlay0: Property.Color;
	overlay1: Property.Color;
	lightOverlay: Property.Color;
	darkOverlay: Property.Color;
	themeOverlay: Property.Color;
	link: Property.Color;
	contrast: Property.Color;
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
	export interface Theme extends Mode, Variant {
		light: Mode & Variant;
		dark: Mode & Variant;
		user: Mode & Variant;
		alternate: Mode & Variant;
		font: FontList;
	}
}

export type { Theme } from "yoshiki";
export type ThemeBuilder = {
	light: Omit<Mode, "contrast" | "mode" | "themeOverlay"> & { default: Variant };
	dark: Omit<Mode, "contrast" | "mode" | "themeOverlay"> & { default: Variant };
};

const selectMode = (
	theme: ThemeBuilder & { font: FontList },
	mode: "light" | "dark" | "auto",
): Theme => {
	const { light: lightBuilder, dark: darkBuilder, ...options } = theme;
	const light: Mode & Variant = {
		...lightBuilder,
		...lightBuilder.default,
		contrast: lightBuilder.colors.black,
		themeOverlay: lightBuilder.lightOverlay,
		mode: "light",
	};
	const dark: Mode & Variant = {
		...darkBuilder,
		...darkBuilder.default,
		contrast: darkBuilder.colors.white,
		themeOverlay: darkBuilder.darkOverlay,
		mode: "dark",
	};
	if (Platform.OS !== "web" || mode !== "auto") {
		const value = mode === "light" ? light : dark;
		const alternate = mode === "light" ? dark : light;
		return {
			...options,
			...value,
			light,
			dark,
			user: value,
			alternate,
		};
	}

	const auto = useAutomaticTheme("theme", { light, dark });
	const alternate = useAutomaticTheme("alternate", { dark: light, light: dark });
	return {
		...options,
		...auto,
		mode: "auto",
		light,
		dark,
		user: { ...auto, mode: "auto" },
		alternate: { ...alternate, mode: "auto" },
	};
};

const switchVariant = (theme: Theme) => {
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

export const ThemeSelector = ({
	children,
	theme,
	font,
}: {
	children: ReactNode;
	theme: "light" | "dark" | "auto";
	font: FontList;
}) => {
	const newTheme = selectMode({ ...catppuccin, font }, theme);

	return <ThemeProvider theme={newTheme}>{children}</ThemeProvider>;
};

export type YoshikiFunc<T> = (props: ReturnType<typeof useYoshiki>) => T;

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
	mode?: "light" | "dark" | "user" | "alternate";
	contrastText?: boolean;
}) => {
	const oldTheme = useTheme();
	const theme: Theme = { ...oldTheme, ...oldTheme[mode] };

	return (
		<ThemeProvider
			theme={
				contrastText
					? {
							...theme,
							// Keep the same skeletons, it looks weird otherwise.
							overlay0: theme.user.overlay0,
							overlay1: theme.user.overlay1,
							heading: theme.contrast,
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
	return color + Math.round(alpha * 255).toString(16);
};
