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

import { QueryIdentifier, QueryPage, User, UserP, queryFn } from "@kyoo/models";
import { Alert, Avatar, Icon, IconButton, Menu, P, Skeleton, tooltip, ts } from "@kyoo/primitives";
import { ScrollView, View } from "react-native";
import { DefaultLayout } from "../layout";
import { SettingsContainer } from "../settings/base";
import { useTranslation } from "react-i18next";
import { InfiniteFetch } from "../fetch-infinite";
import { Layout, WithLoading } from "../fetch";
import { px, useYoshiki } from "yoshiki/native";

import UserI from "@material-symbols/svg-400/rounded/account_circle.svg";
import Admin from "@material-symbols/svg-400/rounded/shield_person.svg";
import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import Delete from "@material-symbols/svg-400/rounded/delete.svg";
import { useQueryClient } from "@tanstack/react-query";

const UserGrid = ({
	isLoading,
	slug,
	username,
	avatar,
	isAdmin,
	...props
}: WithLoading<{ slug: string; username: string; avatar: string; isAdmin: boolean }>) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	return (
		<View {...css({ alignItems: "center" }, props)}>
			<Avatar src={avatar} alt={username} placeholder={username} size={UserGrid.layout.size} fill />
			<View {...css({ flexDirection: "row" })}>
				<Icon
					icon={isAdmin ? Admin : UserI}
					{...css({
						alignSelf: "center",
						m: ts(1),
					})}
					{...tooltip(t(isAdmin ? "admin.users.adminUser" : "admin.users.regularUser"))}
				/>
				<Skeleton>
					<P>{username}</P>
				</Skeleton>
				<Menu Trigger={IconButton} icon={MoreVert} {...tooltip(t("misc.more"))}>
					<Menu.Item
						label={t("admin.users.delete")}
						icon={Delete}
						onSelect={async () => {
							Alert.alert(
								t("admin.users.delete"),
								t("login.delete-confirmation"),
								[
									{ text: t("misc.cancel"), style: "cancel" },
									{
										text: t("misc.delete"),
										onPress: async () => {
											await queryFn({ path: ["users", slug], method: "DELETE" });
											await queryClient.invalidateQueries({ queryKey: ["users"] });
										},
										style: "destructive",
									},
								],
								{
									cancelable: true,
									icon: "warning",
								},
							);
						}}
					/>
				</Menu>
			</View>
		</View>
	);
};

UserGrid.layout = {
	size: px(150),
	numColumns: { xs: 3, sm: 4, md: 5, lg: 6, xl: 8 },
	gap: { xs: ts(1), sm: ts(2), md: ts(4) },
	layout: "grid",
} satisfies Layout;

const UserList = () => {
	const { t } = useTranslation();

	return (
		<SettingsContainer title={t("admin.users.label")}>
			<InfiniteFetch query={UserList.query()} layout={UserGrid.layout}>
				{(user) => (
					<UserGrid
						isLoading={user.isLoading as any}
						slug={user.slug}
						username={user.username}
						avatar={user.logo}
						isAdmin={user.permissions?.includes("admin.write")}
					/>
				)}
			</InfiniteFetch>
		</SettingsContainer>
	);
};

UserList.query = (): QueryIdentifier<User> => ({
	parser: UserP,
	path: ["users"],
	infinite: true,
});

export const AdminPage: QueryPage = () => {
	return (
		<ScrollView contentContainerStyle={{ gap: ts(4), paddingBottom: ts(4) }}>
			<UserList />
		</ScrollView>
	);
};

AdminPage.getLayout = DefaultLayout;
AdminPage.requiredPermissions = ["admin.read"];

AdminPage.getFetchUrls = () => [UserList.query()];
