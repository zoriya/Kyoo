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

import { logout, useAccount, useAccounts, useHasPermission } from "@kyoo/models";
import {
	Input,
	IconButton,
	Header,
	Avatar,
	A,
	tooltip,
	ts,
	Menu,
	PressableFeedback,
	HR,
	Link,
} from "@kyoo/primitives";
import { Platform, type TextInput, View, type ViewProps } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "solito/router";
import { type Stylable, useYoshiki } from "yoshiki/native";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import Login from "@material-symbols/svg-400/rounded/login.svg";
import Register from "@material-symbols/svg-400/rounded/app_registration.svg";
import Logout from "@material-symbols/svg-400/rounded/logout.svg";
import Admin from "@material-symbols/svg-400/rounded/admin_panel_settings.svg";
import Settings from "@material-symbols/svg-400/rounded/settings.svg";
import { KyooLongLogo } from "./icon";
import { forwardRef, useEffect, useRef, useState } from "react";
import { AdminPage } from "../admin";

export const NavbarTitle = (props: Stylable & { onLayout?: ViewProps["onLayout"] }) => {
	const { t } = useTranslation();

	return (
		<A href="/" aria-label={t("navbar.home")} {...tooltip(t("navbar.home"))} {...props}>
			<KyooLongLogo />
		</A>
	);
};

const SearchBar = forwardRef<TextInput, Stylable>(function SearchBar(props, ref) {
	const { theme } = useYoshiki();
	const { t } = useTranslation();
	const { push, replace, back } = useRouter();
	const hasChanged = useRef<boolean>(false);
	const [query, setQuery] = useState("");

	useEffect(() => {
		if (Platform.OS !== "web" || !hasChanged.current) return;
		const action = window.location.pathname.startsWith("/search") ? replace : push;
		if (query) action(`/search?q=${encodeURI(query)}`, undefined, { shallow: true });
		else back();
	}, [query, push, replace, back]);

	return (
		<Input
			ref={ref}
			value={query ?? ""}
			onChangeText={(q) => {
				hasChanged.current = true;
				setQuery(q);
			}}
			placeholder={t("navbar.search")}
			placeholderTextColor={theme.colors.white}
			containerStyle={{ height: ts(4), flexShrink: 1, borderColor: (theme) => theme.colors.white }}
			{...tooltip(t("navbar.search"))}
			{...props}
		/>
	);
});

const getDisplayUrl = (url: string) => {
	url = url.replace(/\/api$/, "");
	url = url.replace(/https?:\/\//, "");
	return url;
};

export const NavbarProfile = () => {
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();
	const account = useAccount();
	const accounts = useAccounts();

	return (
		<Menu
			Trigger={Avatar}
			as={PressableFeedback}
			src={account?.logo}
			placeholder={account?.username}
			alt={t("navbar.login")}
			size={24}
			color={theme.colors.white}
			{...css({ margin: ts(1), justifyContent: "center" })}
			{...tooltip(account?.username ?? t("navbar.login"))}
		>
			{accounts?.map((x) => (
				<Menu.Item
					key={x.id}
					label={Platform.OS === "web" ? x.username : `${x.username} - ${getDisplayUrl(x.apiUrl)}`}
					left={<Avatar placeholder={x.username} src={x.logo} />}
					selected={x.selected}
					onSelect={() => x.select()}
				/>
			))}
			{accounts.length > 0 && <HR />}
			<Menu.Item label={t("misc.settings")} icon={Settings} href="/settings" />
			{!account ? (
				<>
					<Menu.Item label={t("login.login")} icon={Login} href="/login" />
					<Menu.Item label={t("login.register")} icon={Register} href="/register" />
				</>
			) : (
				<>
					<Menu.Item label={t("login.add-account")} icon={Login} href="/login" />
					<Menu.Item label={t("login.logout")} icon={Logout} onSelect={logout} />
				</>
			)}
		</Menu>
	);
};
export const NavbarRight = () => {
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();
	const { push } = useRouter();
	const isAdmin = useHasPermission(AdminPage.requiredPermissions);

	return (
		<View {...css({ flexDirection: "row", alignItems: "center", flexShrink: 1 })}>
			{Platform.OS === "web" ? (
				<SearchBar />
			) : (
				<IconButton
					icon={Search}
					color={theme.colors.white}
					onPress={() => push("/search")}
					{...tooltip(t("navbar.search"))}
				/>
			)}
			{isAdmin && (
				<IconButton
					icon={Admin}
					color={theme.colors.white}
					as={Link}
					href={"/admin"}
					{...tooltip(t("navbar.admin"))}
				/>
			)}
			<NavbarProfile />
		</View>
	);
};

export const Navbar = (props: Stylable) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<Header
			{...css(
				{
					backgroundColor: (theme) => theme.accent,
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
			<View {...css({ flexDirection: "row", alignItems: "center" })}>
				<NavbarTitle {...css({ marginX: ts(2) })} />
				<A
					href="/browse"
					{...css({
						textTransform: "uppercase",
						fontWeight: "bold",
						color: (theme) => theme.contrast,
					})}
				>
					{t("navbar.browse")}
				</A>
			</View>
			<View
				{...css({
					flexGrow: 1,
					flexShrink: 1,
					flexDirection: "row",
					display: { xs: "none", sm: "flex" },
					marginX: ts(2),
				})}
			/>
			<NavbarRight />
		</Header>
	);
};
