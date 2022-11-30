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

import useTranslation from "next-translate/useTranslation";
/* import { Library, LibraryP, Page, Paged } from "~/models"; */
/* import { QueryIdentifier, useFetch } from "~/utils/query"; */
/* import { ErrorSnackbar } from "./errors"; */
import { Stylable, useYoshiki } from "yoshiki/native";
import { IconButton, Header, P, A, ts } from "@kyoo/primitives";
import { Image, View } from "react-native";

const tooltip = (tooltip: string): object => ({});

export const NavbarTitle = (props: Stylable) => {
	const { css } = useYoshiki();
	const { t } = useTranslation("common");

	return (
		<A
			href="/"
			{...tooltip(t("navbar.home"))}
			{...css(
				{
					alignItems: "center",
					display: "flex",
				},
				props,
			)}
		>
			{/* <Image source={"/icon.svg"} width="24px" height="24px" alt="" /> */}
			<P
				{...css({
					marginLeft: ts(1),
					marginRight: ts(2),
					fontFamily: "monospace",
					fontWeight: "700",
					textTransform: "uppercase",
					color: "white",
				})}
			>
				Kyoo
			</P>
		</A>
	);
};

export const Navbar = () => {
	const { css } = useYoshiki();
	const { t } = useTranslation("common");
	/* const { data, error, isSuccess, isError } = useFetch(Navbar.query()); */

	return (
		<Header
			{...css({
				backgroundColor: (theme) => theme.appbar,
				flexDirection: "row",
				alignItems: "center",
			})}
		>
			<IconButton
				icon="menu"
				aria-label="more"
				aria-controls="menu-appbar"
				aria-haspopup="true"
				color="white"
				{...css({ display: { xs: "flex", sm: "none" } })}
			/>
			{/* <Box sx={{ flexGrow: 1, display: { sx: "flex", sm: "none" } }} /> */}
			<NavbarTitle {...css({ marginRight: ts(1) })} />
			{/* <Box sx={{ flexGrow: 1, display: { sx: "flex", sm: "none" } }} /> */}
			<View {...css({ flexGrow: 1, flexDirection: "row", display: { xs: "none", sm: "flex" } })}>
				{
					/*isSuccess
					? data.items.map((library) => */ true
						? [...Array(4)].map((_, i) => (
								<A
									href={`/browse/${i /* library.slug */}`}
									key={i} //{library.slug}
									{...css({
										marginX: ts(1),
										textTransform: "uppercase",
										color: "white",
									})}
								>
									Toto
									{/* {library.name} */}
								</A>
						  ))
						: [...Array(4)].map(
								(_, i) => null,
								/* <Typography key={i} variant="button" px=".25rem"> */
								/* 	<Skeleton width="5rem" /> */
								/* </Typography> */
						  )
				}
			</View>
			<A href="/auth/login" {...tooltip(t("navbar.login"))} {...css({ p: 0 })}>
				{/* <Avatar alt={t("navbar.login")} /> */}
			</A>
			{/* {isError && <ErrorSnackbar error={error} />} */}
		</Header>
	);
};

/* Navbar.query = (): QueryIdentifier<Page<Library>> => ({ */
/* 	parser: Paged(LibraryP), */
/* 	path: ["libraries"], */
/* }); */
