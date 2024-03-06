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

import { ReactNode, createContext, useContext, useEffect, useMemo, useRef } from "react";
import { ServerInfoP, User, UserP } from "./resources";
import { z } from "zod";
import { zdate } from "./utils";
import { removeAccounts, setCookie, updateAccount } from "./account-internal";
import { useMMKVString } from "react-native-mmkv";
import { Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { atom, getDefaultStore, useAtomValue, useSetAtom } from "jotai";
import { useFetch, } from "./query";
import { KyooErrors } from "./kyoo-errors";

export const TokenP = z.object({
	token_type: z.literal("Bearer"),
	access_token: z.string(),
	refresh_token: z.string(),
	expire_in: z.string(),
	expire_at: zdate(),
});
export type Token = z.infer<typeof TokenP>;

export const AccountP = UserP.and(
	z.object({
		// set it optional for accounts logged in before the kind was present
		kind: z.literal("user").optional(),
		token: TokenP,
		apiUrl: z.string(),
		selected: z.boolean(),
	}),
);
export type Account = z.infer<typeof AccountP>;

const defaultApiUrl = Platform.OS === "web" ? "/api" : null;
const currentApiUrl = atom<string | null>(defaultApiUrl);
export const getCurrentApiUrl = () => {
	const store = getDefaultStore();
	return store.get(currentApiUrl);
};
export const useCurrentApiUrl = () => {
	return useAtomValue(currentApiUrl);
};

const AccountContext = createContext<(Account & { select: () => void; remove: () => void })[]>([]);
export const ConnectionErrorContext = createContext<{
	error: KyooErrors | null;
	loading: boolean;
	retry?: () => void;
}>({ error: null, loading: true });

/* eslint-disable react-hooks/rules-of-hooks */
export const AccountProvider = ({
	children,
	ssrAccount,
	ssrError,
}: {
	children: ReactNode;
	ssrAccount?: Account;
	ssrError?: KyooErrors;
}) => {
	const setApiUrl = useSetAtom(currentApiUrl);
	if (Platform.OS === "web" && typeof window === "undefined") {
		const accs = ssrAccount
			? [{ ...ssrAccount, selected: true, select: () => {}, remove: () => {} }]
			: [];

		setApiUrl(process.env.KYOO_URL ?? "http://localhost:5000");

		return (
			<AccountContext.Provider value={accs}>
				<ConnectionErrorContext.Provider
					value={{
						error: ssrError || null,
						loading: false,
						retry: () => {
							queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
						},
					}}
				>
					{children}
				</ConnectionErrorContext.Provider>
			</AccountContext.Provider>
		);
	}

	const initialSsrError = useRef(ssrError);

	const [accStr] = useMMKVString("accounts");
	const acc = accStr ? z.array(AccountP).parse(JSON.parse(accStr)) : null;
	const accounts = useMemo(
		() =>
			acc?.map((account) => ({
				...account,
				select: () => updateAccount(account.id, { ...account, selected: true }),
				remove: () => removeAccounts((x) => x.id == x.id),
			})) ?? [],
		[acc],
	);

	// update user's data from kyoo un startup, it could have changed.
	const selected = useMemo(() => accounts.find((x) => x.selected), [accounts]);
	useEffect(() => {
		setApiUrl(selected?.apiUrl ?? defaultApiUrl);
	}, [selected, setApiUrl]);

	const user = useFetch({
		path: ["auth", "me"],
		parser: UserP,
		placeholderData: selected as User,
		enabled: !!selected,
	});
	useEffect(() => {
		if (!selected || !user.isSuccess || user.isPlaceholderData) return;
		// The id is different when user is stale data, we need to wait for the use effect to invalidate the query.
		if (user.data.id !== selected.id) return;
		const nUser = { ...selected, ...user.data };
		if (!Object.is(selected, nUser)) updateAccount(nUser.id, nUser);
	}, [selected, user]);

	const queryClient = useQueryClient();
	const oldSelectedId = useRef<string | undefined>(selected?.id);
	useEffect(() => {
		// if the user change account (or connect/disconnect), reset query cache.
		if (selected?.id !== oldSelectedId.current) {
			initialSsrError.current = undefined;
			queryClient.invalidateQueries();
		}
		oldSelectedId.current = selected?.id;

		// update cookies for ssr (needs to contains token, theme, language...)
		if (Platform.OS === "web") {
			setCookie("account", selected);
			// cookie used for images and videos since we can't add Authorization headers in img or video tags.
			setCookie("X-Bearer", selected?.token.access_token);
		}
	}, [selected, queryClient]);

	return (
		<AccountContext.Provider value={accounts}>
			<ConnectionErrorContext.Provider
				value={{
					error: selected ? initialSsrError.current ?? user.error : null,
					loading: user.isLoading,
					retry: () => {
						queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
					},
				}}
			>
				{children}
			</ConnectionErrorContext.Provider>
		</AccountContext.Provider>
	);
};

export const useAccount = () => {
	const acc = useContext(AccountContext);
	return acc.find((x) => x.selected) || null;
};

export const useAccounts = () => {
	return useContext(AccountContext);
};

export const useHasPermission = (perms?: string[]) => {
	const account = useAccount();
	const { data } = useFetch({
		path: ["info"],
		parser: ServerInfoP,
	});

	if (!perms || !perms[0]) return true;

	const available = account?.permissions ?? data?.guestPermissions;
	if (!available) return false;
	return perms.every((perm) => available.includes(perm));
};
