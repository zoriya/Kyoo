import Username from "@material-symbols/svg-400/outlined/badge.svg";
import Mail from "@material-symbols/svg-400/outlined/mail.svg";
import Password from "@material-symbols/svg-400/outlined/password.svg";
// import AccountCircle from "@material-symbols/svg-400/rounded/account_circle-fill.svg";
import Delete from "@material-symbols/svg-400/rounded/delete.svg";
import Logout from "@material-symbols/svg-400/rounded/logout.svg";
// import * as ImagePicker from "expo-image-picker";
import { type ComponentProps, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useUniwind } from "uniwind";
import { rem } from "yoshiki/native";
import type { KyooError, User } from "~/models";
import {
	Alert,
	Button,
	H1,
	Icon,
	Input,
	P,
	Popup,
	ts,
	usePopup,
} from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { useMutation } from "~/query";
import { deleteAccount, logout } from "../login/logic";
import { PasswordInput } from "../login/password-input";
import { Preference, SettingsContainer } from "./base";

// function dataURItoBlob(dataURI: string) {
// 	const byteString = atob(dataURI.split(",")[1]);
// 	const ab = new ArrayBuffer(byteString.length);
// 	const ia = new Uint8Array(ab);
// 	for (let i = 0; i < byteString.length; i++) {
// 		ia[i] = byteString.charCodeAt(i);
// 	}
// 	return new Blob([ab], { type: "image/jpeg" });
// }

export const AccountSettings = () => {
	const account = useAccount()!;
	const { theme } = useUniwind();
	const [setPopup, close] = usePopup();
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
									icon: "warning",
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
			{/* <Preference */}
			{/* 	icon={AccountCircle} */}
			{/* 	customIcon={<Avatar src={account.logo} />} */}
			{/* 	label={t("settings.account.avatar.label")} */}
			{/* 	description={t("settings.account.avatar.description")} */}
			{/* > */}
			{/* 	<Button */}
			{/* 		text={t("misc.edit")} */}
			{/* 		onPress={async () => { */}
			{/* 			const img = await ImagePicker.launchImageLibraryAsync({ */}
			{/* 				mediaTypes: ImagePicker.MediaTypeOptions.Images, */}
			{/* 				aspect: [1, 1], */}
			{/* 				quality: 1, */}
			{/* 				base64: true, */}
			{/* 			}); */}
			{/* 			if (img.canceled || img.assets.length !== 1) return; */}
			{/* 			const data = dataURItoBlob(img.assets[0].uri); */}
			{/* 			const formData = new FormData(); */}
			{/* 			formData.append("picture", data); */}
			{/* 			await queryFn({ */}
			{/* 				method: "POST", */}
			{/* 				path: ["auth", "me", "logo"], */}
			{/* 				formData, */}
			{/* 			}); */}
			{/* 		}} */}
			{/* 	/> */}
			{/* 	<Button */}
			{/* 		text={t("misc.delete")} */}
			{/* 		onPress={async () => { */}
			{/* 			await queryFn({ */}
			{/* 				method: "DELETE", */}
			{/* 				path: ["auth", "me", "logo"], */}
			{/* 			}); */}
			{/* 		}} */}
			{/* 	/> */}
			{/* </Preference> */}
			<Preference
				icon={Mail}
				label={t("settings.account.email.label")}
				description={account.email}
			>
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
								hasPassword={true}
								apply={async (op, np) =>
									await editPassword({ oldPassword: op, newPassword: np })
								}
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
					<View
						{...css({ flexDirection: "row", alignItems: "center", gap: ts(2) })}
					>
						<Icon icon={icon} />
						<H1 {...css({ fontSize: rem(2) })}>{label}</H1>
					</View>
					<Input
						autoComplete={autoComplete}
						value={value}
						onChangeText={(v) => setValue(v)}
					/>
					<View
						{...css({
							flexDirection: "row",
							alignSelf: "flex-end",
							gap: ts(1),
						})}
					>
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
					<View
						{...css({ flexDirection: "row", alignItems: "center", gap: ts(2) })}
					>
						<Icon icon={icon} />
						<H1 {...css({ fontSize: rem(2) })}>{label}</H1>
					</View>
					{hasPassword && (
						<PasswordInput
							autoComplete="current-password"
							value={oldValue}
							onChangeText={(v) => setOldValue(v)}
							placeholder={t("settings.account.password.oldPassword")}
						/>
					)}
					<PasswordInput
						autoComplete="new-password"
						value={newValue}
						onChangeText={(v) => setNewValue(v)}
						placeholder={t("settings.account.password.newPassword")}
					/>
					{error && (
						<P {...css({ color: (theme) => theme.colors.red })}>{error}</P>
					)}
					<View
						{...css({
							flexDirection: "row",
							alignSelf: "flex-end",
							gap: ts(1),
						})}
					>
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
									setError((e as KyooError).message);
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
