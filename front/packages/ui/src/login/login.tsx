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

import { loginFunc, QueryPage } from "@kyoo/models";
import { Button, P, Input, ts, H1, A } from "@kyoo/primitives";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { Trans } from "react-i18next";
import { percent, px, useYoshiki } from "yoshiki/native";
import { DefaultLayout } from "../layout";
import { FormPage } from "./form";
import { PasswordInput } from "./password-input";

export const LoginPage: QueryPage = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<FormPage
			{...css({
				marginTop: Platform.OS === "web" ? ts(6) : 0,
			})}
		>
			<H1>{t("login.login")}</H1>
			{Platform.OS !== "web" && (
				<>
					<P {...css({ paddingLeft: ts(1) })}>{t("login.server")}</P>
					<Input variant="big" />
				</>
			)}
			<P {...css({ paddingLeft: ts(1) })}>{t("login.username")}</P>
			<Input autoComplete="username" variant="big" onChangeText={(value) => setUsername(value)} />
			<P {...css({ paddingLeft: ts(1) })}>{t("login.password")}</P>
			<PasswordInput
				autoComplete="password"
				variant="big"
				onChangeText={(value) => setPassword(value)}
			/>
			{error && <P {...css({ color: (theme) => theme.colors.red })}>{error}</P>}
			<Button
				text={t("login.login")}
				onPress={async () => {
					const error = await loginFunc("login", {username, password});
					setError(error);
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
				<Trans i18nKey="login.or-register">
					Don’t have an account? <A href="/register">Register</A>.
				</Trans>
			</P>
		</FormPage>
	);
};

LoginPage.getLayout = DefaultLayout;
