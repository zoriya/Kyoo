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

import { z } from "zod";
import { deleteSecureItem, getSecureItem, setSecureItem, storage } from "./secure-store";
import { zdate } from "./utils";
import { queryFn, setApiUrl } from "./query";
import { KyooErrors } from "./kyoo-errors";
import { Platform } from "react-native";
import { createContext, useEffect, useState } from "react";
import { useMMKVListener } from "react-native-mmkv";

const TokenP = z.object({
	token_type: z.literal("Bearer"),
	access_token: z.string(),
	refresh_token: z.string(),
	expire_in: z.string(),
	expire_at: zdate(),
});
type Token = z.infer<typeof TokenP>;

type Result<A, B> =
	| { ok: true; value: A; error?: undefined }
	| { ok: false; value?: undefined; error: B };

export type Account = Token & { apiUrl: string; username: string };

export const AccountContext = createContext<ReturnType<typeof useAccounts>>({ type: "loading" });

export const useAccounts = () => {
	const [accounts, setAccounts] = useState<Account[]>(JSON.parse(getSecureItem("accounts") ?? "[]"));
	const [verified, setVerified] = useState<{
		status: "ok" | "error" | "loading" | "unverified";
		error?: string;
	}>({ status: "loading" });
	const [retryCount, setRetryCount] = useState(0);

	const sel = getSecureItem("selected");
	let [selected, setSelected] = useState<number | null>(
		sel ? parseInt(sel) : accounts.length > 0 ? 0 : null,
	);
	if (selected === null && accounts.length > 0) selected = 0;
	if (accounts.length === 0) selected = null;

	useEffect(() => {
		async function check() {
			setVerified({status: "loading"});
			const selAcc = accounts![selected!];
			setApiUrl(selAcc.apiUrl);
			const verif = await loginFunc("refresh", selAcc.refresh_token);
			setVerified(verif.ok ? { status: "ok" } : { status: "error", error: verif.error });
		}

		if (accounts.length && selected !== null) check();
		else setVerified({ status: "unverified" });
	// Use the length of the array and not the array directly because we don't care if the refresh token changes.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [accounts.length, selected, retryCount]);

	useMMKVListener((key) => {
		if (key === "accounts") setAccounts(JSON.parse(getSecureItem("accounts") ?? "[]"));
	}, storage);

	if (verified.status === "loading") return { type: "loading" } as const;
	if (accounts.length && verified.status === "unverified") return { type: "loading" } as const;
	if (verified.status === "error") {
		return {
			type: "error",
			error: verified.error,
			retry: () => {
				setVerified({ status: "loading" });
				setRetryCount((x) => x + 1);
			},
		} as const;
	}
	return {
		type: "ok",
		accounts,
		selected,
		setSelected: (selected: number) => {
			setSelected(selected);
			setSecureItem("selected", selected.toString());
		},
	} as const;
};

const addAccount = (token: Token, apiUrl: string, username: string | null) => {
	const accounts: Account[] = JSON.parse(getSecureItem("accounts") ?? "[]");
	if (accounts.find((x) => x.username === username && x.apiUrl === apiUrl)) return;
	accounts.push({ ...token, username: username!, apiUrl });
	setSecureItem("accounts", JSON.stringify(accounts));
};

const setCurrentAccountToken = (token: Token) => {
	const accounts: Account[] = JSON.parse(getSecureItem("accounts") ?? "[]");
	const selected = parseInt(getSecureItem("selected") ?? "0");
	if (selected >= accounts.length) return;

	accounts[selected] = { ...accounts[selected], ...token };
	setSecureItem("accounts", JSON.stringify(accounts));
};

export const loginFunc = async (
	action: "register" | "login" | "refresh",
	body: { username: string; password: string; email?: string } | string,
	apiUrl?: string,
): Promise<Result<Token, string>> => {
	try {
		const token = await queryFn(
			{
				path: ["auth", action, typeof body === "string" && `?token=${body}`],
				method: typeof body === "string" ? "GET" : "POST",
				body: typeof body === "object" ? body : undefined,
				authenticated: false,
				apiUrl,
			},
			TokenP,
		);

		if (typeof window !== "undefined") setSecureItem("auth", JSON.stringify(token));
		if (Platform.OS !== "web" && apiUrl && typeof body !== "string")
			addAccount(token, apiUrl, body.username);
		else if (Platform.OS !== "web" && action === "refresh") setCurrentAccountToken(token);
		return { ok: true, value: token };
	} catch (e) {
		console.error(action, e);
		return { ok: false, error: (e as KyooErrors).errors[0] };
	}
};

export const getTokenWJ = async (cookies?: string): Promise<[string, Token] | [null, null]> => {
	const tokenStr = getSecureItem("auth", cookies);
	if (!tokenStr) return [null, null];
	let token = TokenP.parse(JSON.parse(tokenStr));

	if (token.expire_at <= new Date(new Date().getTime() + 10 * 1000)) {
		const { ok, value: nToken, error } = await loginFunc("refresh", token.refresh_token);
		if (!ok) console.error("Error refreshing token durring ssr:", error);
		else token = nToken;
	}
	return [`${token.token_type} ${token.access_token}`, token];
};

export const getToken = async (cookies?: string): Promise<string | null> =>
	(await getTokenWJ(cookies))[0];

export const logout = () => {
	if (Platform.OS !== "web") {
		let accounts: Account[] = JSON.parse(getSecureItem("accounts") ?? "[]");
		const selected = parseInt(getSecureItem("selected") ?? "0");
		accounts.splice(selected, 1);
		setSecureItem("accounts", JSON.stringify(accounts));
	}

	deleteSecureItem("auth");
};

export const deleteAccount = async () => {
	await queryFn({ path: ["auth", "me"], method: "DELETE" });
	logout();
};
