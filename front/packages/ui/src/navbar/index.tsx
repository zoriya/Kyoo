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

import { Library, LibraryP, Page, Paged, QueryIdentifier } from "@kyoo/models";
import { IconButton, Header, Avatar, A, Skeleton, tooltip, ts } from "@kyoo/primitives";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { rem, Stylable, useYoshiki } from "yoshiki/native";
import { Fetch } from "../fetch";
import { KyooLongLogo } from "./icon";

export const NavbarTitle = (props: Stylable) => {
	const { t } = useTranslation();

	return (
		<A href="/" {...tooltip(t("navbar.home"))} {...props}>
			<KyooLongLogo />
		</A>
	);
};

export const Navbar = (props: Stylable) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<Header
			{...css(
				{
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
					zIndex: 1,
				},
				props,
			)}
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
							<Skeleton key={i} {...css({ width: rem(5) })} />
						)
					}
				</Fetch>
			</View>
			<A href="/auth/login" {...tooltip(t("navbar.login"))}>
				<Avatar alt={t("navbar.login")} size={30} />
			</A>
		</Header>
	);
};

Navbar.query = (): QueryIdentifier<Page<Library>> => ({
	parser: Paged(LibraryP),
	path: ["libraries"],
});
