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

import { ThemeBuilder } from "./theme";

// Ref: https://github.com/catppuccin/catppuccin
export const catppuccin: ThemeBuilder = {
	fonts: {
		heading: "Pacifico",
		paragraph: "Poppins",
	},
	light: {
		// Catppuccin latte
		appbar: "#e64553",
		overlay0: "#9ca0b0",
		overlay1: "#7c7f93",
		default: {
			background: "#eff1f5",
			accent: "#ea76cb",
			divider: "#8c8fa1",
			heading: "#4c4f69",
			paragraph: "#5c5f77",
			subtext: "#6c6f85",
		},
		variant: {
			background: "#dc8a78",
			accent: "#d20f39",
			divider: "#dd7878",
			heading: "#4c4f69",
			paragraph: "#5c5f77",
			subtext: "#6c6f85",
		},
		colors: {
			red: "#d20f39",
			green: "#40a02b",
			blue: "#1e66f5",
			yellow: "#df8e1d",
			black: "#4c4f69",
			white: "#eff1f5",
		},
	},
	dark: {
		// Catppuccin mocha
		appbar: "#94e2d5",
		overlay0: "#6c7086",
		overlay1: "#9399b2",
		default: {
			background: "#1e1e2e",
			accent: "##f5c2e7",
			divider: "#7f849c",
			heading: "#cdd6f4",
			paragraph: "#bac2de",
			subtext: "#a6adc8",
		},
		variant: {
			background: "#181825",
			accent: "#74c7ec",
			divider: "#1e1e2e",
			heading: "#cdd6f4",
			paragraph: "#bac2de",
			subtext: "#a6adc8",
		},
		colors: {
			red: "#f38ba8",
			green: "#a6e3a1",
			blue: "#89b4fa",
			yellow: "#f9e2af",
			black: "#11111b",
			white: "#cdd6f4",
		},
	},
};
