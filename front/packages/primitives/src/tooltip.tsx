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

import { ToastAndroid, PressableProps } from "react-native";
import { Theme } from "yoshiki/native";

export const tooltip = (tooltip: string) =>
	({
		dataSet: { tooltip },
		onLongPress: () => {
			// TODO handle IOS.
			ToastAndroid.show(tooltip, ToastAndroid.SHORT);
		},
	} satisfies PressableProps);

export const WebTooltip = ({ theme }: { theme: Theme }) => {
	const background = `${theme.colors.black}CC`;

	return (
		<style jsx global>{`
			[data-tooltip] {
				position: relative;
			}

			[data-tooltip]::after {
				content: attr(data-tooltip);

				position: absolute;
				top: 100%;
				left: 50%;
				transform: translate(-50%);

				margin-top: 8px;
				border-radius: 5px;
				padding: 6px;
				font-size: 0.8rem;
				color: ${theme.colors.white};
				background-color: ${background};
				font-family: ${theme.fonts.paragraph};

				opacity: 0;
				visibility: hidden;
				transition: opacity 0.3s ease-in-out;
			}

			:where(body:not(.noHover)) [data-tooltip]:hover::after,
			[data-tooltip]:focus-visible::after {
				opacity: 1;
				visibility: visible;
			}

			:focus:not(:focus-visible) {
				outline: none;
			}

			:focus-visible {
				outline: none;
				transition: box-shadow 0.15s ease-in-out;
				box-shadow: 0 0 0 2px ${theme.colors.black};
				/* box-shadow: ${theme.accent} 1px; */
			}
		`}</style>
	);
};
