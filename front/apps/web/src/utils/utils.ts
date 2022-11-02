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

export const makeTitle = (title?: string) => {
	return title ? `${title} - Kyoo` : "Kyoo";
};

let preventHover: boolean = false;
let hoverTimeout: NodeJS.Timeout;

export const useMobileHover = () => {
	useEffect(() => {
		const enableHover = () => {
			if (preventHover) return;
			document.body.classList.add("hoverEnabled");
		};

		const disableHover = () => {
			if (hoverTimeout) clearTimeout(hoverTimeout);
			preventHover = true;
			hoverTimeout = setTimeout(() => (preventHover = false), 500);
			document.body.classList.remove("hoverEnabled");
		};

		document.addEventListener("touchstart", disableHover, true);
		document.addEventListener("mousemove", enableHover, true);
		return () => {
			document.removeEventListener("touchstart", disableHover);
			document.removeEventListener("mousemove", enableHover);
		};
	}, []);
};
