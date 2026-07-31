import Username from "@material-symbols/svg-400/outlined/badge.svg";
import Mail from "@material-symbols/svg-400/outlined/mail.svg";
import Password from "@material-symbols/svg-400/outlined/password.svg";
import AccountCircle from "@material-symbols/svg-400/rounded/account_circle-fill.svg";
import Delete from "@material-symbols/svg-400/rounded/delete.svg";
import Logout from "@material-symbols/svg-400/rounded/logout.svg";
import * as ImagePicker from "expo-image-picker";
import { type ComponentProps, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useUniwind } from "uniwind";
import type { KyooError, User } from "~/models";
import {
	Alert,
	Avatar,
	Button,
	type Icon,
	Input,
	P,
	Popup,
} from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { useMutation } from "~/query";
import { deleteAccount, logout } from "../login/logic";
import { PasswordInput } from "../login/password-input";
import { Preference, SettingsContainer } from "./base";

export const AccountSettings = () => {
	const account = useAccount()!;
	const { theme } = useUniwind();
	const [openPopup, setOpenPopup] = useState<
		"username" | "email" | "password" | null
	>(null);
	const close = () => setOpenPopup(null);
	const { t } = useTranslation();

	const { mutateAsync } = useMutation({
		method: "PATCH",
		path: ["auth", "users", "me"],
		compute: (update: Partial<User>) => ({ body: update }),
		optimistic: (update) => ({
			...account,
			...update,
			claims: { ...account.claims, ...update.claims },
		}),
		invalidate: ["auth", "users", "me"],
	});

	const { mutateAsync: editPassword } = useMutation({
		method: "PATCH",
		path: ["auth", "users", "me", "password"],
		compute: (body: { oldPassword: string; newPassword: string }) => ({
			body,
		}),
		invalidate: ["auth", "users", "me"],
	});

	const { mutateAsync: editLogo } = useMutation({
		path: ["auth", "users", "me", "logo"],
		compute: (formData: FormData | null) => ({
			method: formData ? "POST" : "DELETE",
			formData: formData ?? undefined,
		}),
		invalidate: null,
	});

	return (
		<SettingsContainer
			title={t("settings.account.label")}
			extra={
				<View className="mt-4 flex-row gap-4">
					<Button
						icon={Logout}
						text={t("login.logout")}
						onPress={logout}
						className="flex-1"
					/>
					<Button
						icon={Delete}
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
									userInterfaceStyle: theme as "light" | "dark",
								},
							);
						}}
						className="flex-1"
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
					onPress={() => setOpenPopup("username")}
				/>
			</Preference>
			<Preference
				icon={AccountCircle}
				customIcon={
					<Avatar src={account.logo} placeholder={account.username} />
				}
				label={t("settings.account.avatar.label")}
				description={t("settings.account.avatar.description")}
			>
				<Button
					text={t("misc.edit")}
					onPress={async () => {
						const img = await ImagePicker.launchImageLibraryAsync({
							mediaTypes: "images",
							allowsEditing: true,
							aspect: [1, 1],
							shape: "oval",
							quality: 0,
							base64: true,
						});
						if (img.canceled || img.assets.length !== 1) return;
						const response = await fetch(img.assets[0].uri);
						const formData = new FormData();
						formData.append(
							"logo",
							await response.blob(),
							img.assets[0].fileName ?? "logo.jpg",
						);
						await editLogo(formData);
					}}
				/>
				<Button
					text={t("misc.delete")}
					onPress={async () => {
						await editLogo(null);
					}}
				/>
			</Preference>
			<Preference
				icon={Mail}
				label={t("settings.account.email.label")}
				description={account.email}
			>
				<Button text={t("misc.edit")} onPress={() => setOpenPopup("email")} />
			</Preference>
			<Preference
				icon={Password}
				label={t("settings.account.password.label")}
				description={t("settings.account.password.description")}
			>
				<Button
					text={t("misc.edit")}
					onPress={() => setOpenPopup("password")}
				/>
			</Preference>
			{openPopup === "username" && (
				<ChangePopup
					icon={Username}
					autoComplete="username-new"
					label={t("settings.account.username.label")}
					inital={account.username}
					apply={async (v) => await mutateAsync({ username: v })}
					close={close}
				/>
			)}
			{openPopup === "email" && (
				<ChangePopup
					icon={Mail}
					autoComplete="email"
					label={t("settings.account.email.label")}
					inital={account.email}
					apply={async (v) => await mutateAsync({ email: v })}
					close={close}
				/>
			)}
			{openPopup === "password" && (
				<ChangePasswordPopup
					icon={Password}
					label={t("settings.account.password.label")}
					hasPassword={account.hasPassword}
					apply={async (op, np) =>
						await editPassword({ oldPassword: op, newPassword: np })
					}
					close={close}
				/>
			)}
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
		<Popup title={label} icon={icon} close={close}>
			<Input
				autoComplete={autoComplete}
				value={value}
				onChangeText={(v) => setValue(v)}
			/>
			<View className="flex-row gap-2 self-end">
				<Button
					text={t("misc.cancel")}
					onPress={() => close()}
					className="min-w-24"
				/>
				<Button
					text={t("misc.edit")}
					onPress={async () => {
						await apply(value);
						close();
					}}
					className="min-w-24"
				/>
			</View>
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
		<Popup title={label} icon={icon} close={close}>
			{hasPassword && (
				<PasswordInput
					autoComplete="current-password"
					value={oldValue}
					onChangeText={(v) => setOldValue(v)}
					placeholder={t("settings.account.password.oldPassword")}
					containerClassName="my-1"
				/>
			)}
			<PasswordInput
				autoComplete="new-password"
				value={newValue}
				onChangeText={(v) => setNewValue(v)}
				placeholder={t("settings.account.password.newPassword")}
				containerClassName="my-1"
			/>
			{error && <P className="text-red-500">{error}</P>}
			<View className="my-1 flex-row gap-2 self-end">
				<Button
					text={t("misc.cancel")}
					onPress={() => close()}
					className="min-w-24"
				/>
				<Button
					text={t("misc.edit")}
					onPress={async () => {
						try {
							await apply(oldValue, newValue);
							close();
						} catch (e) {
							setError((e as KyooError).message);
						}
					}}
					className="min-w-24"
				/>
			</View>
		</Popup>
	);
};
