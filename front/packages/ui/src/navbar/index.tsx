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
	AccountContext,
	deleteAccount,
	logout,
	QueryIdentifier,
	User,
	UserP,
} from "@kyoo/models";
import {
	Alert,
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
} from "@kyoo/primitives";
import { Platform, TextInput, View, ViewProps } from "react-native";
import { useTranslation } from "react-i18next";
import { createParam } from "solito";
import { useRouter } from "solito/router";
import { Stylable, useYoshiki } from "yoshiki/native";
import MenuIcon from "@material-symbols/svg-400/rounded/menu-fill.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import Login from "@material-symbols/svg-400/rounded/login.svg";
import Register from "@material-symbols/svg-400/rounded/app_registration.svg";
import Logout from "@material-symbols/svg-400/rounded/logout.svg";
import Delete from "@material-symbols/svg-400/rounded/delete.svg";
import { FetchNE } from "../fetch";
import { KyooLongLogo } from "./icon";
import { forwardRef, useContext, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
			value={query ?? ""}
			onBlur={() => onBlur?.call(null, query)}
			onChangeText={(q) => {
				if (Platform.OS === "web") {
					const action = window.location.pathname.startsWith("/search") ? replace : push;
					if (q) action(`/search?q=${encodeURI(q)}`, undefined, { shallow: true });
					else back();
				}
			}}
			placeholder={t("navbar.search")}
			placeholderTextColor={theme.light.overlay0}
			{...tooltip(t("navbar.search"))}
			{...css({ borderColor: (theme) => theme.colors.white, height: ts(4) }, props)}
		/>
	);
});

export const MeQuery: QueryIdentifier<User> = {
	path: ["auth", "me"],
	parser: UserP,
};

const getDisplayUrl = (url: string) => {
	url = url.replace(/\/api$/, "");
	url = url.replace(/https?:\/\//, "");
	return url;
};

export const NavbarProfile = () => {
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { accounts, selected, setSelected } = useContext(AccountContext);

	return (
		<FetchNE query={MeQuery}>
			{({ isError: isGuest, username }) => (
				<Menu
					Trigger={Avatar}
					as={PressableFeedback}
					placeholder={username}
					alt={t("navbar.login")}
					size={24}
					color={theme.colors.white}
					{...css({ marginLeft: ts(1), justifyContent: "center" })}
					{...tooltip(username ?? t("navbar.login"))}
				>
					{accounts?.map((x, i) => (
						<Menu.Item
							key={x.refresh_token}
							label={`${x.username} - ${getDisplayUrl(x.apiUrl)}`}
							left={<Avatar placeholder={x.username} />}
							selected={selected === i}
							onSelect={() => setSelected!(i)}
						/>
					))}
					{accounts && accounts.length > 0 && <HR />}
					{isGuest ? (
						<>
							<Menu.Item label={t("login.login")} icon={Login} href="/login" />
							<Menu.Item label={t("login.register")} icon={Register} href="/register" />
						</>
					) : (
						<>
							<Menu.Item label={t("login.add-account")} icon={Login} href="/login" />
							<Menu.Item
								label={t("login.logout")}
								icon={Logout}
								onSelect={() => {
									logout();
									queryClient.invalidateQueries(["auth", "me"]);
								}}
							/>
							<Menu.Item
								label={t("login.delete")}
								icon={Delete}
								onSelect={async () => {
									Alert.alert(
										t("login.delete"),
										t("login.delete-confirmation"),
										[
											{
												text: t("misc.delete"),
												onPress: async () => {
													await deleteAccount();
													queryClient.invalidateQueries(["auth", "me"]);
												},
												style: "destructive",
											},
											{ text: t("misc.cancel"), style: "cancel" },
										],
										{
											cancelable: true,
											userInterfaceStyle: theme.mode === "auto" ? "light" : theme.mode,
											icon: "warning",
										},
									);
								}}
							/>
						</>
					)}
				</Menu>
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
		<View {...css({ flexDirection: "row", alignItems: "center" })}>
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
			<IconButton
				icon={MenuIcon}
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
			/>
			<NavbarRight />
		</Header>
	);
};
