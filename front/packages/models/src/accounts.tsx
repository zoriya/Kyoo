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

import { getSecureItem, setSecureItem, storage } from "./secure-store";
import { setApiUrl } from "./query";
import { createContext, useEffect, useState } from "react";
import { useMMKVListener } from "react-native-mmkv";
import { Account, loginFunc } from "./login";

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
			const verif = await loginFunc("refresh", selAcc.refresh_token, undefined, 5_000);
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

