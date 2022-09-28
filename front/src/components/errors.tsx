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

import { Alert, Box, Snackbar, SnackbarCloseReason, Typography, SxProps } from "@mui/material";
import { SyntheticEvent, useState } from "react";
import { KyooErrors } from "~/models";

export const ErrorComponent = ({ errors, sx }: { errors: string[]; sx?: SxProps }) => {
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100%",
				backgroundColor: "error.light",
				...sx,
			}}
		>
			<Typography variant="h1" component="h1" sx={{ fontWeight: 500 }}>
				Error
			</Typography>
			{errors.map((x, i) => (
				<Typography variant="h2" component="h2" key={i}>
					{x}
				</Typography>
			))}
		</Box>
	);
};

export const ErrorPage = ({ errors }: { errors: string[] }) => {
	return (
		<Box sx={{ height: "100vh" }}>
			<ErrorComponent errors={errors} sx={{ backgroundColor: "unset" }} />
		</Box>
	);
};

export const ErrorSnackbar = ({ error }: { error: KyooErrors }) => {
	const [isOpen, setOpen] = useState(true);
	const close = (_: Event | SyntheticEvent, reason?: SnackbarCloseReason) => {
		if (reason !== "clickaway") setOpen(false);
	};

	if (!isOpen) return null;
	return (
		<Snackbar open={isOpen} onClose={close} autoHideDuration={6000}>
			<Alert severity="error" onClose={close} sx={{ width: "100%" }}>
				{error.errors[0]}
			</Alert>
		</Snackbar>
	);
};
