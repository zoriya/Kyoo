import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { z } from "zod/v4";
import { Account, type KyooError, User } from "~/models";
import { keyToUrl, queryFn, toQueryKey } from "~/query";
import { AccountContext, AccountsContext } from "./account-context";
import { readAccounts, removeAccounts, updateAccount } from "./account-store";
import { useStoreValue } from "./settings";

export const defaultApiUrl = "";

export const AccountProvider = ({ children }: { children: ReactNode }) => {
	const queryClient = useQueryClient();
	const router = useRouter();
	const accounts = useStoreValue("accounts", z.array(Account)) ?? [];

	const accountsV = useMemo(
		() => ({
			selectedAccount: accounts.find((x) => x.selected) ?? accounts[0] ?? null,
			accounts: accounts.map((account) => ({
				...account,
				select: () => updateAccount(account.id, { ...account, selected: true }),
				remove: () => removeAccounts((x) => x.id === account.id),
			})),
		}),
		[accounts],
	);

	// Keep the auth context keyed on the raw primitives so that editing an
	// account (which produces a new `selectedAccount` object with an unchanged
	// url/token) doesn't change this value and re-render every `useFetch`.
	const apiUrl =
		accountsV.selectedAccount?.apiUrl ||
		(Platform.OS === "web" && typeof window !== "undefined"
			? window.location.origin
			: defaultApiUrl);
	const authToken = accountsV.selectedAccount?.token ?? null;
	const auth = useMemo(() => ({ apiUrl, authToken }), [apiUrl, authToken]);


	useEffect(() => {
		if (Platform.OS === "web" || apiUrl) return;
		const id = setTimeout(() => router.replace("/login"), 0);
		return () => clearTimeout(id);
	}, [apiUrl, router]);

	// update user's data from kyoo on startup, it could have changed.
	// (provider lives above the navigator, we can't use `useFetch`)
	const { i18n } = useTranslation();
	const meKey = toQueryKey({ apiUrl, path: ["auth", "users", "me"] });
	const {
		isSuccess: userIsSuccess,
		isPlaceholderData: userIsPlaceholder,
		data: user,
		error: userError,
	} = useQuery<User, KyooError>({
		queryKey: meKey,
		queryFn: (ctx) =>
			queryFn({
				url: keyToUrl(meKey),
				parser: User,
				signal: ctx.signal,
				authToken,
				lang: i18n.resolvedLanguage,
			}),
		placeholderData: accountsV.selectedAccount ?? undefined,
		enabled: !!accountsV.selectedAccount,
	});
	useEffect(() => {
		if (userError) router.replace("/login");
	}, [userError, router]);

	// Persist fresh server data into the stored account on launch. Depends only
	// on the fetch result — never on the selected account — so the storage write
	// doesn't loop back into this effect. The current account is read straight
	// from storage to always merge into its freshest value.
	useEffect(() => {
		if (!userIsSuccess || userIsPlaceholder || !user) return;
		const accounts = readAccounts();
		const selected = accounts.find((x) => x.selected) ?? accounts[0];
		// The id is different when user is stale data, we need to wait
		// for the use effect to invalidate the query.
		if (!selected || user.id !== selected.id) return;
		updateAccount(selected.id, { ...selected, ...user });
	}, [user, userIsSuccess, userIsPlaceholder]);

	const curId = accountsV.selectedAccount?.id;
	useEffect(() => {
		console.log("Selected user changed, new id: ", curId);
		// if the user change account (or connect/disconnect), reset query cache.
		queryClient.resetQueries();
	}, [curId, queryClient]);

	return (
		<AccountContext.Provider value={auth}>
			<AccountsContext.Provider value={accountsV}>
				{children}
			</AccountsContext.Provider>
		</AccountContext.Provider>
	);
};
