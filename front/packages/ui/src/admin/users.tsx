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

import { type QueryIdentifier, type User, UserP, queryFn } from "@kyoo/models";
import { Alert, Avatar, Icon, IconButton, Menu, P, Skeleton, tooltip, ts } from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { px, useYoshiki } from "yoshiki/native";
import type { Layout, WithLoading } from "../fetch";
import { InfiniteFetch } from "../fetch-infinite";
import { SettingsContainer } from "../settings/base";

import UserI from "@material-symbols/svg-400/rounded/account_circle.svg";
import Delete from "@material-symbols/svg-400/rounded/delete.svg";
import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import Verifed from "@material-symbols/svg-400/rounded/verified_user.svg";
import Unverifed from "@material-symbols/svg-400/rounded/gpp_bad.svg";
import Admin from "@material-symbols/svg-400/rounded/shield_person.svg";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const UserGrid = ({
	isLoading,
	id,
	username,
	avatar,
	isAdmin,
	isVerified,
	...props
}: WithLoading<{
	id: string;
	username: string;
	avatar: string;
	isAdmin: boolean;
	isVerified: boolean;
}>) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { mutateAsync } = useMutation({
		mutationFn: async (update: Partial<User>) =>
			await queryFn({
				path: ["users", id],
				method: "PATCH",
				body: update,
			}),
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ["users"] }),
	});

	return (
		<View {...css({ alignItems: "center" }, props)}>
			<Avatar src={avatar} alt={username} placeholder={username} size={UserGrid.layout.size} fill />
			<View {...css({ flexDirection: "row" })}>
				<Icon
					icon={!isVerified ? Unverifed : isAdmin ? Admin : UserI}
					{...css({
						alignSelf: "center",
						m: ts(1),
					})}
					{...tooltip(
						t(
							!isVerified
								? "admin.users.unverifed"
								: isAdmin
									? "admin.users.adminUser"
									: "admin.users.regularUser",
						),
					)}
				/>
				<Skeleton>
					<P>{username}</P>
				</Skeleton>
				<Menu Trigger={IconButton} icon={MoreVert} {...tooltip(t("misc.more"))}>
					{!isVerified && (
						<Menu.Item
							label={t("admin.users.verify")}
							icon={Verifed}
							onSelect={() =>
								mutateAsync({
									permissions: ["overall.read", "overall.play"],
								})
							}
						/>
					)}
					<Menu.Sub label={t("admin.users.set-permissions")} icon={Admin}>
						<Menu.Item
							selected={!isAdmin}
							label={t("admin.users.regularUser")}
							onSelect={() =>
								mutateAsync({
									permissions: ["overall.read", "overall.play"],
								})
							}
						/>
						<Menu.Item
							selected={isAdmin}
							label={t("admin.users.adminUser")}
							onSelect={() =>
								mutateAsync({
									permissions: [
										"overall.read",
										"overall.write",
										"overall.create",
										"overall.delete",
										"overall.play",
										"admin.read",
										"admin.write",
										"admin.create",
										"admin.delete",
									],
								})
							}
						/>
					</Menu.Sub>
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
											await queryFn({ path: ["users", id], method: "DELETE" });
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
	numColumns: { xs: 2, sm: 3, md: 5, lg: 6, xl: 7 },
	gap: { xs: ts(1), sm: ts(2), md: ts(4) },
	layout: "grid",
} satisfies Layout;

export const UserList = () => {
	const { t } = useTranslation();

	return (
		<SettingsContainer title={t("admin.users.label")}>
			<InfiniteFetch query={UserList.query()} layout={UserGrid.layout}>
				{(user) => (
					<UserGrid
						isLoading={user.isLoading as any}
						id={user.id}
						username={user.username}
						avatar={user.logo}
						isAdmin={user.isAdmin}
						isVerified={user.isVerified}
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
