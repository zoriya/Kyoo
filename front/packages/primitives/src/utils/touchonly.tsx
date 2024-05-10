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

import { useEffect } from "react";
import { Platform, type ViewProps } from "react-native";

export const TouchOnlyCss = () => {
	return (
		<style jsx global>{`
			:where(body.noHover) .noTouch {
				display: none;
			}
			:where(body:not(.noHover)) .touchOnly {
				display: none;
			}
		`}</style>
	);
};

export const touchOnly: ViewProps = {
	style: Platform.OS === "web" ? ({ $$css: true, touchOnly: "touchOnly" } as any) : {},
};
export const noTouch: ViewProps = {
	style: Platform.OS === "web" ? ({ $$css: true, noTouch: "noTouch" } as any) : { display: "none" },
};

export const useIsTouch = () => {
	if (Platform.OS !== "web") return true;
	if (typeof window === "undefined") return false;
	// TODO: Subscribe to the change.
	return document.body.classList.contains("noHover");
};
