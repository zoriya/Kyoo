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
import { Text, TextStyle } from "react-native";
import { splitRender } from "yoshiki";
import { em, useYoshiki } from "yoshiki/native";

const headerStyles: Record<"h1" | "h2" | "h3" | "h4" | "h5" | "h6", TextStyle> = {
	h1: {
		fontSize: em(2),
		marginVertical: em(0.67),
		fontWeight: "bold",
	},
	h2: {
		fontSize: em(1.5),
		marginVertical: em(0.83),
		fontWeight: "bold",
	},
	h3: {
		fontSize: em(1.17),
		marginVertical: em(1),
		fontWeight: "bold",
	},
	h4: {
		fontSize: em(1),
		marginVertical: em(1.33),
		fontWeight: "bold",
	},
	h5: {
		fontSize: em(0.83),
		marginVertical: em(1.67),
		fontWeight: "bold",
	},
	h6: {
		fontSize: em(0.67),
		marginVertical: em(2.33),
		fontWeight: "bold",
	},
};

const textGenerator = (webHeader?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") =>
	splitRender<HTMLParagraphElement, Text, { children: ReactNode }, "text">(
		function _PWeb({ children, ...props }, ref) {
			const T = webHeader ?? "p";
			return (
				<T ref={ref} {...props}>
					{children}
				</T>
			);
		},
		function _PNative({ children, ...props }, ref) {
			const { css } = useYoshiki();

			return (
				<Text
					ref={ref}
					accessibilityRole={webHeader ? "header" : "text"}
					{...css(webHeader ? headerStyles[webHeader] : {}, props)}
				>
					{children}
				</Text>
			);
		},
	);

export const H1 = textGenerator("h1");
export const H2 = textGenerator("h2");
export const H3 = textGenerator("h3");
export const H4 = textGenerator("h4");
export const H5 = textGenerator("h5");
export const H6 = textGenerator("h6");
export const P = textGenerator();
