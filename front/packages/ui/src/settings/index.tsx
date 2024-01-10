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
	Account,
	KyooErrors,
	QueryPage,
	deleteAccount,
	logout,
	queryFn,
	setUserTheme,
	useAccount,
	useUserTheme,
} from "@kyoo/models";
import {
	Alert,
	Button,
	Container,
	H1,
	HR,
	Icon,
	Input,
	Link,
	P,
	Popup,
	Select,
	SubP,
	SwitchVariant,
	imageBorderRadius,
	ts,
} from "@kyoo/primitives";
import { DefaultLayout } from "../layout";
import { Children, ComponentProps, ReactElement, ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { px, rem, useYoshiki } from "yoshiki/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PasswordInput } from "../login/password-input";

import Theme from "@material-symbols/svg-400/outlined/dark_mode.svg";
import Username from "@material-symbols/svg-400/outlined/badge.svg";
import Mail from "@material-symbols/svg-400/outlined/mail.svg";
import Password from "@material-symbols/svg-400/outlined/password.svg";
import Logout from "@material-symbols/svg-400/rounded/logout.svg";
import Delete from "@material-symbols/svg-400/rounded/delete.svg";
import Android from "@material-symbols/svg-400/rounded/android.svg";
import Public from "@material-symbols/svg-400/rounded/public.svg";

const Preference = ({
	icon,
	label,
	description,
	children,
	...props
}: {
	icon: Icon;
	label: string;
	description: string;
	children?: ReactNode;
}) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css(
				{
					margin: ts(1),
					flexGrow: 1,
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
				},
				props,
			)}
		>
			<View {...css({ flexDirection: "row", alignItems: "center" })}>
				<Icon icon={icon} {...css({ marginX: ts(2) })} />
				<View>
					<P {...css({ marginBottom: 0 })}>{label}</P>
					<SubP>{description}</SubP>
				</View>
			</View>
			<View {...css({ marginX: ts(2) })}>{children}</View>
		</View>
	);
};

const SettingsContainer = ({
	children,
	title,
	extra,
	...props
}: {
	children: ReactElement | ReactElement[];
	title: string;
	extra?: ReactElement;
}) => {
	const { css } = useYoshiki();

	return (
		<Container {...props}>
			<H1 {...css({ fontSize: rem(2) })}>{title}</H1>
			<SwitchVariant>
				{({ css }) => (
					<View
						{...css({
							bg: (theme) => theme.background,
							borderRadius: px(imageBorderRadius),
						})}
					>
						{Children.map(children, (x, i) => (
							<>
								{i !== 0 && <HR {...css({ marginY: ts(1) })} />}
								{x}
							</>
						))}
					</View>
				)}
			</SwitchVariant>
			{extra}
		</Container>
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
	apply,
	close,
}: {
	label: string;
	icon: Icon;
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
					<PasswordInput
						autoComplete="current-password"
						variant="big"
						value={oldValue}
						onChangeText={(v) => setOldValue(v)}
						placeholder={t("settings.account.password.oldPassword")}
					/>
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

const AccountSettings = ({ setPopup }: { setPopup: (e?: ReactElement) => void }) => {
	const account = useAccount();
	const { css, theme } = useYoshiki();
	const { t } = useTranslation();

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
		account && (
			<SettingsContainer
				title={t("settings.account.label")}
				extra={
					<View {...css({ marginTop: ts(2), gap: ts(2), flexDirection: "row" })}>
						<Button
							licon={<Icon icon={Logout} {...css({ marginX: ts(1) })} />}
							text={t("login.logout")}
							onPress={logout}
							{...css({ flex: 1 })}
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
							{...css({ flex: 1 })}
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
									close={() => setPopup(undefined)}
								/>,
							)
						}
					/>
				</Preference>
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
									close={() => setPopup(undefined)}
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
									apply={async (op, np) => await editPassword({ oldPassword: op, newPassword: np })}
									close={() => setPopup(undefined)}
								/>,
							)
						}
					/>
				</Preference>
			</SettingsContainer>
		)
	);
};

export const SettingsPage: QueryPage = () => {
	const { t } = useTranslation();
	const [popup, setPopup] = useState<ReactElement | undefined>(undefined);

	const theme = useUserTheme("auto");
	return (
		<>
			<ScrollView contentContainerStyle={{ gap: ts(4) }}>
				<SettingsContainer title={t("settings.general.label")}>
					<Preference
						icon={Theme}
						label={t("settings.general.theme.label")}
						description={t("settings.general.theme.description")}
					>
						<Select
							label={t("settings.general.theme.label")}
							value={theme}
							onValueChange={(value) => setUserTheme(value)}
							values={["auto", "light", "dark"]}
							getLabel={(key) => t(`settings.general.theme.${key}`)}
						/>
					</Preference>
				</SettingsContainer>
				<AccountSettings setPopup={setPopup} />
				<SettingsContainer title={t("settings.about.label")}>
					<Link href="https://github.com/zoriya/kyoo/releases/latest/download/kyoo.apk" target="_blank">
						<Preference
							icon={Android}
							label={t("settings.about.android-app.label")}
							description={t("settings.about.android-app.description")}
						/>
					</Link>
					<Link href="https://github.com/zoriya/kyoo" target="_blank">
						<Preference
							icon={Public}
							label={t("settings.about.git.label")}
							description={t("settings.about.git.description")}
						/>
					</Link>
				</SettingsContainer>
			</ScrollView>
			{popup}
		</>
	);
};

SettingsPage.getLayout = DefaultLayout;
