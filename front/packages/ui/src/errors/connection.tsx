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

import { ConnectionErrorContext, useAccount } from "@kyoo/models";
import { Button, H1, Icon, Link, P, ts } from "@kyoo/primitives";
import { useRouter } from "solito/router";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { DefaultLayout } from "../layout";
import Register from "@material-symbols/svg-400/rounded/app_registration.svg";

export const ConnectionError = () => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const router = useRouter();
	const { error, retry } = useContext(ConnectionErrorContext);
	const account = useAccount();

	if (error && (error.status === 401 || error.status === 403)) {
		if (!account) {
			return (
				<View
					{...css({ flexGrow: 1, flexShrink: 1, justifyContent: "center", alignItems: "center" })}
				>
					<P>{t("errors.needAccount")}</P>
					<Button
						as={Link}
						href={"/register"}
						text={t("login.register")}
						licon={<Icon icon={Register} {...css({ marginRight: ts(2) })} />}
					/>
				</View>
			);
		}
		if (!account.isVerified) {
			return (
				<View
					{...css({ flexGrow: 1, flexShrink: 1, justifyContent: "center", alignItems: "center" })}
				>
					<P>{t("errors.needVerification")}</P>
				</View>
			);
		}
	}
	return (
		<View {...css({ padding: ts(2) })}>
			<H1 {...css({ textAlign: "center" })}>{t("errors.connection")}</H1>
			<P>{error?.errors[0] ?? t("error.unknown")}</P>
			<P>{t("errors.connection-tips")}</P>
			<Button onPress={retry} text={t("errors.try-again")} {...css({ m: ts(1) })} />
			<Button
				onPress={() => router.push("/login")}
				text={t("errors.re-login")}
				{...css({ m: ts(1) })}
			/>
		</View>
	);
};

ConnectionError.getLayout = DefaultLayout;
