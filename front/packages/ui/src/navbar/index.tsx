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

import { Library, LibraryP, Page, Paged, QueryIdentifier, User, UserP } from "@kyoo/models";
import {
	Input,
	IconButton,
	Header,
	Avatar,
	A,
	Skeleton,
	tooltip,
	ts,
	Link,
} from "@kyoo/primitives";
import { Platform, TextInput, View, ViewProps } from "react-native";
import { useTranslation } from "react-i18next";
import { createParam } from "solito";
import { useRouter } from "solito/router";
import { rem, Stylable, useYoshiki } from "yoshiki/native";
import Menu from "@material-symbols/svg-400/rounded/menu-fill.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import { Fetch, FetchNE } from "../fetch";
import { KyooLongLogo } from "./icon";
import { forwardRef, useRef, useState } from "react";

export const NavbarTitle = (props: Stylable & { onLayout?: ViewProps["onLayout"] }) => {
	const { t } = useTranslation();

	return (
		<A href="/" {...tooltip(t("navbar.home"))} {...props}>
			<KyooLongLogo />
		</A>
	);
};

const { useParam } = createParam<{ q?: string }>();

const SearchBar = forwardRef<
	TextInput,
	{ onBlur?: (value: string | undefined) => void } & Stylable
>(function _SearchBar({ onBlur, ...props }, ref) {
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();
	const { push, replace, back } = useRouter();
	const [query] = useParam("q");

	return (
		<Input
			ref={ref}
			value={query}
			onBlur={() => onBlur?.call(null, query)}
			onChangeText={(q) => {
				if (Platform.OS === "web") {
					const action = window.location.pathname.startsWith("/search") ? replace : push;
					if (q) action(`/search?q=${q}`, undefined, { shallow: true });
					else back();
				}
			}}
			placeholder={t("navbar.search")}
			placeholderTextColor={theme.light.overlay0}
			{...tooltip(t("navbar.search"))}
			{...css({ borderColor: (theme) => theme.colors.white }, props)}
		/>
	);
});

export const MeQuery: QueryIdentifier<User> = {
	path: ["auth", "me"],
	parser: UserP,
};

export const NavbarProfile = () => {
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();

	// TODO: show logged in user.
	return (
		<FetchNE query={MeQuery}>
			{({ username }) => (
				<Link
					href="/login"
					{...tooltip(username ?? t("navbar.login"))}
					{...css({ marginLeft: ts(1), justifyContent: "center" })}
				>
					<Avatar
						placeholder={username}
						alt={t("navbar.login")}
						size={30}
						color={theme.colors.white}
					/>
				</Link>
			)}
		</FetchNE>
	);
};
export const NavbarRight = () => {
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();
	const [isSearching, setSearch] = useState(false);
	const ref = useRef<TextInput | null>(null);
	const [query] = useParam("q");
	const { push } = useRouter();
	const searchExpanded = isSearching || query;

	return (
		<View {...css({ flexDirection: "row" })}>
			{Platform.OS === "web" && (
				<SearchBar
					ref={ref}
					onBlur={(q) => {
						if (!q) setSearch(false);
					}}
					{...css({
						display: { xs: searchExpanded ? "flex" : "none", md: "flex" },
					})}
				/>
			)}
			{!searchExpanded && (
				<IconButton
					icon={Search}
					color={theme.colors.white}
					onPress={
						Platform.OS === "web"
							? () => {
								setSearch(true);
								setTimeout(() => ref.current?.focus(), 0);
							}
							: () => push("/search")
					}
					{...tooltip(t("navbar.search"))}
					{...css(Platform.OS === "web" && { display: { xs: "flex", md: "none" } })}
				/>
			)}
			<NavbarProfile />
		</View>
	);
};

export const Navbar = (props: Stylable) => {
	const { css, theme } = useYoshiki();

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
				icon={Menu}
				aria-label="more"
				aria-controls="menu-appbar"
				aria-haspopup="true"
				color={theme.colors.white}
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
							<Skeleton key={i} {...css({ width: rem(5), marginX: ts(1) })} />
						)
					}
				</Fetch>
			</View>
			<NavbarRight />
		</Header>
	);
};

Navbar.query = (): QueryIdentifier<Page<Library>> => ({
	parser: Paged(LibraryP),
	path: ["libraries"],
});
