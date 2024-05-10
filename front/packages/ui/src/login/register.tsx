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

import { login, type QueryPage } from "@kyoo/models";
import { Button, P, Input, ts, H1, A } from "@kyoo/primitives";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import { useRouter } from "solito/router";
import { percent, px, useYoshiki } from "yoshiki/native";
import { DefaultLayout } from "../layout";
import { FormPage } from "./form";
import { PasswordInput } from "./password-input";
import { OidcLogin } from "./oidc";
import { Platform } from "react-native";

export const RegisterPage: QueryPage<{ apiUrl?: string }> = ({ apiUrl }) => {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | undefined>(undefined);

	const router = useRouter();
	const { t } = useTranslation();
	const { css } = useYoshiki();

	useEffect(() => {
		if (!apiUrl && Platform.OS !== "web")
			router.replace("/server-url", undefined, {
				experimental: { nativeBehavior: "stack-replace", isNestedNavigator: false },
			});
	}, [apiUrl, router]);

	return (
		<FormPage apiUrl={apiUrl}>
			<H1>{t("login.register")}</H1>
			<OidcLogin apiUrl={apiUrl} />
			<P {...css({ paddingLeft: ts(1) })}>{t("login.username")}</P>
			<Input autoComplete="username" variant="big" onChangeText={(value) => setUsername(value)} />

			<P {...css({ paddingLeft: ts(1) })}>{t("login.email")}</P>
			<Input autoComplete="email" variant="big" onChangeText={(value) => setEmail(value)} />

			<P {...css({ paddingLeft: ts(1) })}>{t("login.password")}</P>
			<PasswordInput
				autoComplete="password-new"
				variant="big"
				onChangeText={(value) => setPassword(value)}
			/>

			<P {...css({ paddingLeft: ts(1) })}>{t("login.confirm")}</P>
			<PasswordInput
				autoComplete="password-new"
				variant="big"
				onChangeText={(value) => setConfirm(value)}
			/>

			{password !== confirm && (
				<P {...css({ color: (theme) => theme.colors.red })}>{t("login.password-no-match")}</P>
			)}
			{error && <P {...css({ color: (theme) => theme.colors.red })}>{error}</P>}
			<Button
				text={t("login.register")}
				disabled={password !== confirm}
				onPress={async () => {
					const { error } = await login("register", { email, username, password, apiUrl });
					setError(error);
					if (error) return;
					router.replace("/", undefined, {
						experimental: { nativeBehavior: "stack-replace", isNestedNavigator: false },
					});
				}}
				{...css({
					m: ts(1),
					width: px(250),
					maxWidth: percent(100),
					alignSelf: "center",
					mY: ts(3),
				})}
			/>
			<P>
				<Trans i18nKey="login.or-login">
					Have an account already? <A href={{ pathname: "/login", query: { apiUrl } }}>Log in</A>.
				</Trans>
			</P>
		</FormPage>
	);
};

RegisterPage.getFetchUrls = () => [OidcLogin.query()];
RegisterPage.isPublic = true;
RegisterPage.getLayout = DefaultLayout;
