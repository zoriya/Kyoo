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

import { KyooErrors, useAccount } from "@kyoo/models";
import { Button, Icon, Link, P, ts } from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { rem, useYoshiki } from "yoshiki/native";
import { ErrorView } from "./error";
import Register from "@material-symbols/svg-400/rounded/app_registration.svg";

export const Unauthorized = ({ missing }: { missing: string[] }) => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<View
			{...css({
				flexGrow: 1,
				flexShrink: 1,
				justifyContent: "center",
				alignItems: "center",
			})}
		>
			<P>{t("errors.unauthorized", { permission: missing?.join(", ") })}</P>
		</View>
	);
};

export const PermissionError = ({ error }: { error: KyooErrors }) => {
	const { t } = useTranslation();
	const { css } = useYoshiki();
	const account = useAccount();

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
	if (account.isVerified) return <ErrorView error={error} noBubble />;
	return (
		<View {...css({ flexGrow: 1, flexShrink: 1, justifyContent: "center", alignItems: "center" })}>
			<P>{t("errors.needVerification")}</P>
		</View>
	);
};
