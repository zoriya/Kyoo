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

import type { Theme } from "yoshiki/native";
import { Tooltip as RTooltip } from "react-tooltip";
import { forwardRef } from "react";
import { ContrastArea } from "./themes";

export const tooltip = (tooltip: string, up?: boolean) => ({
	dataSet: {
		tooltipContent: tooltip,
		label: tooltip,
		tooltipPlace: up ? "top" : "bottom",
		tooltipId: "tooltip",
	},
});

export const WebTooltip = ({ theme }: { theme: Theme }) => {
	return (
		<style jsx global>{`
			body {
				--rt-color-white: ${theme.alternate.contrast};
				--rt-color-dark: ${theme.user.contrast};
				--rt-opacity: 0.9;
				--rt-transition-show-delay: 0.15s;
				--rt-transition-closing-delay: 0.15s;
			}
		`}</style>
	);
};

export const Tooltip = forwardRef(function Tooltip(props, ref) {
	return (
		<ContrastArea mode="alternate">
			<RTooltip {...props} ref={ref} />
		</ContrastArea>
	);
}) as typeof RTooltip;
