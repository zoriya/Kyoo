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

export const catppuccin: ThemeBuilder = {
	fonts: {
		heading: "Pacifico",
		paragraph: "Poppins",
	},
	light: {
		appbar: "#e64553",
		contrast: "#cdd6f4",
		subcontrast: "#bac2de",
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
	},
	dark: {
		appbar: "#94e2d5",
		contrast: "#cdd6f4",
		subcontrast: "#bac2de",
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
	},
};
