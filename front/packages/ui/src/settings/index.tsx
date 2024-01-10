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
	MutationParam,
	QueryIdentifier,
	QueryPage,
	User,
	UserP,
	queryFn,
	setUserTheme,
	useAccount,
	useUserTheme,
} from "@kyoo/models";
import {
	Button,
	Container,
	H1,
	HR,
	Icon,
	Input,
	P,
	Select,
	SubP,
	SwitchVariant,
	imageBorderRadius,
	ts,
} from "@kyoo/primitives";
import { DefaultLayout } from "../layout";
import { Children, ReactElement, ReactNode, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { Portal } from "@gorhom/portal";
import { percent, px, rem, useYoshiki } from "yoshiki/native";

import Theme from "@material-symbols/svg-400/outlined/dark_mode.svg";
import Username from "@material-symbols/svg-400/outlined/badge.svg";
import Mail from "@material-symbols/svg-400/outlined/mail.svg";
import Password from "@material-symbols/svg-400/outlined/password.svg";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
}: {
	children: ReactElement | ReactElement[];
	title: string;
}) => {
	const { css } = useYoshiki();
	return (
		<Container>
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
		</Container>
	);
};

const ChangePopup = ({
	label,
	icon,
	inital,
	apply,
	close,
}: {
	label: string;
	icon: Icon;
	inital: string;
	apply: (v: string) => Promise<unknown>;
	close: () => void;
}) => {
	const { t } = useTranslation();
	const [value, setValue] = useState(inital);

	return (
		<Portal>
			<SwitchVariant>
				{({ css }) => (
					<View
						{...css({
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							bg: (theme) => theme.themeOverlay,
						})}
					>
						<Container
							{...css({
								borderRadius: px(imageBorderRadius),
								position: "absolute",
								top: percent(35),
								padding: ts(4),
								gap: ts(2),
								bg: (theme) => theme.background,
							})}
						>
							<View {...css({ flexDirection: "row", alignItems: "center", gap: ts(2) })}>
								<Icon icon={icon} />
								<H1 {...css({ fontSize: rem(2) })}>{label}</H1>
							</View>
							<Input variant="big" value={value} onChangeText={(v) => setValue(v)} />
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
						</Container>
					</View>
				)}
			</SwitchVariant>
		</Portal>
	);
};

const AccountSettings = ({ setPopup }: { setPopup: (e?: ReactElement) => void }) => {
	const account = useAccount();
	const { css } = useYoshiki();
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

	return (
		account && (
			<SettingsContainer title={t("settings.account.label")}>
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
				></Preference>
			</SettingsContainer>
		)
	);
};

const query: QueryIdentifier<User> = {
	parser: UserP,
	path: ["auth", "me"],
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
			</ScrollView>
			{popup}
		</>
	);
};

SettingsPage.getLayout = DefaultLayout;

SettingsPage.getFetchUrls = () => [query];
