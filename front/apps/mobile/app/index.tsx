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

import { Account, loginFunc } from "@kyoo/models";
import { getSecureItem, setSecureItem } from "@kyoo/models/src/secure-store";
import { Button, CircularProgress, H1, P, ts } from "@kyoo/primitives";
import { Redirect } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { useRouter } from "solito/router";

export const useAccounts = () => {
	const [accounts, setAccounts] = useState<Account[] | null>(null);
	const [verified, setVerified] = useState<{
		status: "ok" | "error" | "loading" | "unverified";
		error?: string;
	}>({ status: "loading" });
	// TODO: Remember the last selected account.
	const selected = accounts?.length ? 0 : null;

	useEffect(() => {
		async function run() {
			const accounts = await getSecureItem("accounts");
			setAccounts(accounts ? JSON.parse(accounts) : []);
		}
		run();
	}, []);

	useEffect(() => {
		async function check() {
			const selAcc = accounts![selected!];
			await setSecureItem("apiUrl", selAcc.apiUrl);
			const verif = await loginFunc("refresh", selAcc.refresh_token);
			setVerified(verif.ok ? { status: "ok" } : { status: "error", error: verif.error });
		}

		if (accounts && selected !== null) check();
		else setVerified({status: "unverified"});
	}, [accounts, selected]);

	if (accounts === null || verified.status === "loading") return { type: "loading" } as const;
	if (accounts !== null && verified.status === "unverified") return { type: "loading" } as const;
	if (verified.status === "error") {
		return {
			type: "error",
			error: verified.error,
			retry: () => setVerified({ status: "loading" }),
		} as const;
	}
	return { type: "ok", accounts, selected } as const;
};

export const ConnectionError = ({ error, retry }: { error?: string; retry: () => void }) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<View {...css({ padding: ts(2)})}>
			<H1 {...css({ textAlign: "center"})}>{t("errors.connection")}</H1>
			<P>{error ?? t("error.unknown")}</P>
			<P>{t("errors.connection-tips")}</P>
			<Button onPress={retry} text={t("errors.try-again")}  {...css({ m: ts(1)})} />
			<Button onPress={() => router.push("/login")} text={t("errors.re-login")} {...css({ m: ts(1)})} />
		</View>
	);
};

export const AccountContext = createContext<ReturnType<typeof useAccounts>>({ type: "loading" });

const App = () => {
	const info = useContext(AccountContext);
	if (info.type === "loading") return <CircularProgress />
	if (info.type === "error") return <ConnectionError error={info.error} retry={info.retry} />;
	if (info.selected === null) return <Redirect href="/login" />;
	// While there is no home page, show the browse page.
	return <Redirect href="/browse" />;
};

export default App;
