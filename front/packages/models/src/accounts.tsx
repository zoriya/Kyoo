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
import { UserP } from "./resources";
import { z } from "zod";
import { zdate } from "./utils";
import { removeAccounts, setAccountCookie, updateAccount } from "./account-internal";
import { useMMKVString } from "react-native-mmkv";
import { Platform } from "react-native";
import { useFetch } from "./query";
import { useQueryClient } from "@tanstack/react-query";
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
		token: TokenP,
		apiUrl: z.string(),
		selected: z.boolean(),
	}),
);
export type Account = z.infer<typeof AccountP>;

const AccountContext = createContext<(Account & { select: () => void; remove: () => void })[]>([]);
export const ConnectionErrorContext = createContext<{
	error: KyooErrors | null;
	retry?: () => void;
}>({ error: null });

/* eslint-disable react-hooks/rules-of-hooks */
export const AccountProvider = ({
	children,
	ssrAccount,
}: {
	children: ReactNode;
	ssrAccount?: Account;
}) => {
	if (Platform.OS === "web" && typeof window === "undefined") {
		const accs = ssrAccount
			? [{ ...ssrAccount, selected: true, select: () => { }, remove: () => { } }]
			: [];
		return (
			<AccountContext.Provider value={accs}>
				<ConnectionErrorContext.Provider
					value={{
						error: null,
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
	const user = useFetch({
		path: ["auth", "me"],
		parser: UserP,
		placeholderData: selected,
		enabled: !!selected,
		timeout: 5_000,
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
		if (selected?.id !== oldSelectedId.current) queryClient.invalidateQueries();
		oldSelectedId.current = selected?.id;

		// update cookies for ssr (needs to contains token, theme, language...)
		if (Platform.OS === "web") setAccountCookie(selected);
	}, [selected, queryClient]);

	return (
		<AccountContext.Provider value={accounts}>
			<ConnectionErrorContext.Provider
				value={{
					error: user.error,
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
	return acc.find((x) => x.selected);
};

export const useAccounts = () => {
	return useContext(AccountContext);
};
