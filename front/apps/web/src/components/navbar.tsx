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

import {
	AppBar,
	Toolbar,
	Typography,
	Avatar,
	IconButton,
	Tooltip,
	Box,
	Skeleton,
	AppBarProps,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import useTranslation from "next-translate/useTranslation";
import { ButtonLink } from "~/utils/link";
import { Library, LibraryP, Page, Paged } from "~/models";
import { QueryIdentifier, useFetch } from "~/utils/query";
import { ErrorSnackbar } from "./errors";

const KyooTitle = () => {
	const { t } = useTranslation("common");

	return (
		<Tooltip title={t("navbar.home")}>
			<ButtonLink
				css={{
					alignItems: "center",
					color: "inherit",
					textDecoration: "inherit",
					display: "flex",
				}}
				href="/"
			>
				<img src={"/icon.svg"} width="24px" height="24px" alt="" />
				<Typography
					variant="h6"
					noWrap
					css={{
						ml: 8,
						mr: 16,
						fontFamily: "monospace",
						fontWeight: 700,
						color: "white",
					}}
				>
					Kyoo
				</Typography>
			</ButtonLink>
		</Tooltip>
	);
};

export const Navbar = (barProps: AppBarProps) => {
	const { t } = useTranslation("common");
	const { data, error, isSuccess, isError } = useFetch(Navbar.query());

	return (
		<AppBar position="sticky" {...barProps}>
			<Toolbar>
				<IconButton
					size="large"
					aria-label="more"
					aria-controls="menu-appbar"
					aria-haspopup="true"
					color="inherit"
					sx={{ display: { sx: "flex", sm: "none" } }}
				>
					<MenuIcon />
				</IconButton>
				<Box sx={{ flexGrow: 1, display: { sx: "flex", sm: "none" } }} />
				<KyooTitle css={{ mr: 1 }} />
				<Box sx={{ flexGrow: 1, display: { sx: "flex", sm: "none" } }} />
				<Box sx={{ flexGrow: 1, display: { xs: "none", sm: "flex" } }}>
					{isSuccess
						? data.items.map((library) => (
								<ButtonLink
									href={`/browse/${library.slug}`}
									key={library.slug}
									sx={{ color: "white" }}
								>
									{library.name}
								</ButtonLink>
						  ))
						: [...Array(4)].map((_, i) => (
								<Typography key={i} variant="button" px=".25rem">
									<Skeleton width="5rem" />
								</Typography>
						  ))}
				</Box>
				<Tooltip title={t("navbar.login")}>
					<IconButton css={{ p: 0 }} href="/auth/login">
						<Avatar alt={t("navbar.login")} />
					</IconButton>
				</Tooltip>
			</Toolbar>
			{isError && <ErrorSnackbar error={error} />}
		</AppBar>
	);
};

Navbar.query = (): QueryIdentifier<Page<Library>> => ({
	parser: Paged(LibraryP),
	path: ["libraries"],
});
