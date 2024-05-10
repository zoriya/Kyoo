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

import { Account, KyooErrors, deleteAccount, logout, queryFn, useAccount } from "@kyoo/models";
import { Alert, Avatar, Button, H1, Icon, Input, P, Popup, ts, usePopup } from "@kyoo/primitives";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ComponentProps, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { rem, useYoshiki } from "yoshiki/native";
import * as ImagePicker from "expo-image-picker";
import { PasswordInput } from "../login/password-input";
import { Preference, SettingsContainer } from "./base";

import Username from "@material-symbols/svg-400/outlined/badge.svg";
import AccountCircle from "@material-symbols/svg-400/rounded/account_circle-fill.svg";
import Mail from "@material-symbols/svg-400/outlined/mail.svg";
import Password from "@material-symbols/svg-400/outlined/password.svg";
import Delete from "@material-symbols/svg-400/rounded/delete.svg";
import Logout from "@material-symbols/svg-400/rounded/logout.svg";

function dataURItoBlob(dataURI: string) {
	const byteString = atob(dataURI.split(",")[1]);
	const ab = new ArrayBuffer(byteString.length);
	const ia = new Uint8Array(ab);
	for (let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	return new Blob([ab], { type: "image/jpeg" });
}

export const AccountSettings = () => {
	const account = useAccount()!;
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();
	const [setPopup, close] = usePopup();

	const queryClient = useQueryClient();
	const { mutateAsync } = useMutation({
		mutationFn: async (update: Partial<Account>) =>
			await queryFn({
				path: ["auth", "me"],
				method: "PATCH",
				body: update,
			}),
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
	});
	const { mutateAsync: editPassword } = useMutation({
		mutationFn: async (request: { newPassword: string; oldPassword: string }) =>
			await queryFn({
				path: ["auth", "password-reset"],
				method: "POST",
				body: request,
			}),
	});

	return (
		<SettingsContainer
			title={t("settings.account.label")}
			extra={
				<View {...css({ marginTop: ts(2), gap: ts(2), flexDirection: "row" })}>
					<Button
						licon={<Icon icon={Logout} {...css({ marginX: ts(1) })} />}
						text={t("login.logout")}
						onPress={logout}
						{...css({ flexGrow: 1, flexShrink: 1, flexBasis: 0 })}
					/>
					<Button
						licon={<Icon icon={Delete} {...css({ marginX: ts(1) })} />}
						text={t("login.delete")}
						onPress={async () => {
							Alert.alert(
								t("login.delete"),
								t("login.delete-confirmation"),
								[
									{ text: t("misc.cancel"), style: "cancel" },
									{
										text: t("misc.delete"),
										onPress: deleteAccount,
										style: "destructive",
									},
								],
								{
									cancelable: true,
									userInterfaceStyle: theme.mode === "auto" ? "light" : theme.mode,
									icon: "warning",
								},
							);
						}}
						{...css({ flexGrow: 1, flexShrink: 1, flexBasis: 0 })}
					/>
				</View>
			}
		>
			<Preference
				icon={Username}
				label={t("settings.account.username.label")}
				description={account.username}
			>
				<Button
					text={t("misc.edit")}
					onPress={() =>
						setPopup(
							<ChangePopup
								icon={Username}
								autoComplete="username-new"
								label={t("settings.account.username.label")}
								inital={account.username}
								apply={async (v) => await mutateAsync({ username: v })}
								close={close}
							/>,
						)
					}
				/>
			</Preference>
			<Preference
				icon={AccountCircle}
				customIcon={<Avatar src={account.logo} />}
				label={t("settings.account.avatar.label")}
				description={t("settings.account.avatar.description")}
			>
				<Button
					text={t("misc.edit")}
					onPress={async () => {
						const img = await ImagePicker.launchImageLibraryAsync({
							mediaTypes: ImagePicker.MediaTypeOptions.Images,
							aspect: [1, 1],
							quality: 1,
							base64: true,
						});
						if (img.canceled || img.assets.length !== 1) return;
						const data = dataURItoBlob(img.assets[0].uri);
						const formData = new FormData();
						formData.append("picture", data);
						await queryFn({
							method: "POST",
							path: ["auth", "me", "logo"],
							formData,
						});
					}}
				/>
				<Button
					text={t("misc.delete")}
					onPress={async () => {
						await queryFn({
							method: "DELETE",
							path: ["auth", "me", "logo"],
						});
					}}
				/>
			</Preference>
			<Preference icon={Mail} label={t("settings.account.email.label")} description={account.email}>
				<Button
					text={t("misc.edit")}
					onPress={() =>
						setPopup(
							<ChangePopup
								icon={Mail}
								autoComplete="email"
								label={t("settings.account.email.label")}
								inital={account.email}
								apply={async (v) => await mutateAsync({ email: v })}
								close={close}
							/>,
						)
					}
				/>
			</Preference>
			<Preference
				icon={Password}
				label={t("settings.account.password.label")}
				description={t("settings.account.password.description")}
			>
				<Button
					text={t("misc.edit")}
					onPress={() =>
						setPopup(
							<ChangePasswordPopup
								icon={Password}
								label={t("settings.account.password.label")}
								hasPassword={account.hasPassword}
								apply={async (op, np) => await editPassword({ oldPassword: op, newPassword: np })}
								close={close}
							/>,
						)
					}
				/>
			</Preference>
		</SettingsContainer>
	);
};

const ChangePopup = ({
	label,
	icon,
	inital,
	autoComplete,
	apply,
	close,
}: {
	label: string;
	icon: Icon;
	inital: string;
	autoComplete: ComponentProps<typeof Input>["autoComplete"];
	apply: (v: string) => Promise<unknown>;
	close: () => void;
}) => {
	const { t } = useTranslation();
	const [value, setValue] = useState(inital);

	return (
		<Popup>
			{({ css }) => (
				<>
					<View {...css({ flexDirection: "row", alignItems: "center", gap: ts(2) })}>
						<Icon icon={icon} />
						<H1 {...css({ fontSize: rem(2) })}>{label}</H1>
					</View>
					<Input
						autoComplete={autoComplete}
						variant="big"
						value={value}
						onChangeText={(v) => setValue(v)}
					/>
					<View {...css({ flexDirection: "row", alignSelf: "flex-end", gap: ts(1) })}>
						<Button
							text={t("misc.cancel")}
							onPress={() => close()}
							{...css({ minWidth: rem(6) })}
						/>
						<Button
							text={t("misc.edit")}
							onPress={async () => {
								await apply(value);
								close();
							}}
							{...css({ minWidth: rem(6) })}
						/>
					</View>
				</>
			)}
		</Popup>
	);
};

const ChangePasswordPopup = ({
	label,
	icon,
	hasPassword,
	apply,
	close,
}: {
	label: string;
	icon: Icon;
	hasPassword: boolean;
	apply: (oldPassword: string, newPassword: string) => Promise<unknown>;
	close: () => void;
}) => {
	const { t } = useTranslation();
	const [oldValue, setOldValue] = useState("");
	const [newValue, setNewValue] = useState("");
	const [error, setError] = useState<string | null>(null);

	return (
		<Popup>
			{({ css }) => (
				<>
					<View {...css({ flexDirection: "row", alignItems: "center", gap: ts(2) })}>
						<Icon icon={icon} />
						<H1 {...css({ fontSize: rem(2) })}>{label}</H1>
					</View>
					{hasPassword && (
						<PasswordInput
							autoComplete="current-password"
							variant="big"
							value={oldValue}
							onChangeText={(v) => setOldValue(v)}
							placeholder={t("settings.account.password.oldPassword")}
						/>
					)}
					<PasswordInput
						autoComplete="password-new"
						variant="big"
						value={newValue}
						onChangeText={(v) => setNewValue(v)}
						placeholder={t("settings.account.password.newPassword")}
					/>
					{error && <P {...css({ color: (theme) => theme.colors.red })}>{error}</P>}
					<View {...css({ flexDirection: "row", alignSelf: "flex-end", gap: ts(1) })}>
						<Button
							text={t("misc.cancel")}
							onPress={() => close()}
							{...css({ minWidth: rem(6) })}
						/>
						<Button
							text={t("misc.edit")}
							onPress={async () => {
								try {
									await apply(oldValue, newValue);
									close();
								} catch (e) {
									setError((e as KyooErrors).errors[0]);
								}
							}}
							{...css({ minWidth: rem(6) })}
						/>
					</View>
				</>
			)}
		</Popup>
	);
};
