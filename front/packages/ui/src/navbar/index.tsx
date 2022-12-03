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
import { Library, LibraryP, Page, Paged, QueryIdentifier } from "@kyoo/models";
import { useYoshiki } from "yoshiki/native";
import { IconButton, Header, Avatar, A, Skeleton, ts } from "@kyoo/primitives";
import { Text, View } from "react-native";
import { Fetch } from "../fetch";
import { KyooLongLogo } from "./icon";

const tooltip = (tooltip: string): object => ({});

export const NavbarTitle = KyooLongLogo;

export const Navbar = () => {
	const { css } = useYoshiki();
	const { t } = useTranslation("common");

	return (
		<Header
			{...css({
				backgroundColor: (theme) => theme.appbar,
				paddingX: ts(2),
				height: { xs: 48, sm: 64 },
				flexDirection: "row",
				justifyContent: { xs: "space-between", sm: "flex-start" },
				alignItems: "center",
				shadowColor: "#000",
				shadowOffset: {
					width: 0,
					height: 4,
				},
				shadowOpacity: 0.3,
				shadowRadius: 4.65,
				elevation: 8,
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
			<NavbarTitle {...css({ marginX: ts(2) })} />
			<View
				{...css({
					flexGrow: 1,
					flexShrink: 1,
					flexDirection: "row",
					display: { xs: "none", sm: "flex" },
					marginX: ts(2),
				})}
			>
				<Fetch query={Navbar.query()} placeholderCount={4}>
					{(library, i) =>
						!library.isLoading ? (
							<A
								href={`/browse/${library.slug}`}
								key={library.slug}
								{...css({
									marginX: ts(1),
									textTransform: "uppercase",
									color: "white",
								})}
							>
								{library.name}
							</A>
						) : (
							<>
								<Text>Toto</Text>
								{/* <Typography key={i} variant="button" px=".25rem"> */}
								{/* 	<Skeleton width="5rem" /> */}
								{/* </Typography> */}
							</>
						)
					}
				</Fetch>
				<Skeleton>
					<Text>Toto</Text>
				</Skeleton>
			</View>
			<A href="/auth/login" {...tooltip(t("navbar.login"))}>
				<Avatar alt={t("navbar.login")} size={30} />
			</A>
			{/* {isError && <ErrorSnackbar error={error} />} */}
		</Header>
	);
};

Navbar.query = (): QueryIdentifier<Page<Library>> => ({
	parser: Paged(LibraryP),
	path: ["libraries"],
});
