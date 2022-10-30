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

import { styled, experimental_sx as sx } from "@mui/system";

export const Container = styled("div")(
	sx({
		display: "flex",
		px: "15px",
		mx: "auto",
		width: {
			sm: "540px",
			md: "880px",
			lg: "1170px",
		},
	}),
);

export const containerPadding = {
	xs: "15px",
	sm: "calc((100vw - 540px) / 2)",
	md: "calc((100vw - 880px) / 2)",
	lg: "calc((100vw - 1170px) / 2)",
};
