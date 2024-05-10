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

import type { ThemeBuilder } from "./theme";

// Ref: https://github.com/catppuccin/catppuccin
export const catppuccin: ThemeBuilder = {
	light: {
		// Catppuccin latte
		overlay0: "#9ca0b0",
		overlay1: "#7c7f93",
		lightOverlay: "#eff1f599",
		darkOverlay: "#4c4f6999",
		link: "#1e66f5",
		default: {
			background: "#eff1f5",
			accent: "#e64553",
			divider: "#8c8fa1",
			heading: "#4c4f69",
			paragraph: "#5c5f77",
			subtext: "#6c6f85",
		},
		variant: {
			background: "#e6e9ef",
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
		overlay0: "#6c7086",
		overlay1: "#9399b2",
		lightOverlay: "#f5f0f899",
		darkOverlay: "#11111b99",
		link: "#89b4fa",
		default: {
			background: "#1e1e2e",
			accent: "#89b4fa",
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
			white: "#f5f0f8",
		},
	},
};
