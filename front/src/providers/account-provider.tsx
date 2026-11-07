import { useController } from "@data-client/react";
import { useRouter, useSegments } from "expo-router";
import { type ReactNode, useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { z } from "zod/v4";
import { useDLE } from "~/data";
import { Account, User } from "~/models";
import { RetryableError } from "~/models/retryable-error";
import { AccountContext, AccountsContext, useAccount } from "./account-context";
import { readAccounts, removeAccounts, updateAccount } from "./account-store";
import { useStoreValue } from "./settings";

export const defaultApiUrl = "";

export const AccountProvider = ({ children }: { children: ReactNode }) => {
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

	// the watch page can play a cast (android tv) with the caster's account
	const segments: string[] = useSegments();
	const needsAccount = segments[0] === "(app)" && segments[1] !== "watch";
	useEffect(() => {
		if (Platform.OS === "web" || apiUrl || !needsAccount) return;
		const id = setTimeout(() => router.replace("/login"), 0);
		return () => clearTimeout(id);
	}, [apiUrl, router, needsAccount]);

	const curId = accountsV.selectedAccount?.id;
	const ctrl = useController();
	useEffect(() => {
		console.log("Selected user changed, new id: ", curId);
		// if the user change account (or connect/disconnect), reset the store.
		ctrl.resetEntireStore();
	}, [curId, ctrl]);

	return (
		<AccountContext.Provider value={auth}>
			<AccountsContext.Provider value={accountsV}>
				<AccountSync />
				{children}
			</AccountsContext.Provider>
		</AccountContext.Provider>
	);
};

// update user's data from kyoo on startup, it could have changed.
const AccountSync = () => {
	const router = useRouter();
	const account = useAccount();
	const { data: user, error } = useDLE(
		{
			schema: User,
			path: ["auth", "users", "me"],
			enabled: !!account,
		},
		{ returnError: true },
	);
	useEffect(() => {
		if (error && !(error instanceof RetryableError && error.key === "offline"))
			router.replace("/login");
	}, [error, router]);

	// Persist fresh server data into the stored account on launch. Depends only
	// on the fetch result — never on the selected account — so the storage write
	// doesn't loop back into this effect. The current account is read straight
	// from storage to always merge into its freshest value.
	useEffect(() => {
		if (!user) return;
		const accounts = readAccounts();
		const selected = accounts.find((x) => x.selected) ?? accounts[0];
		// The id is different when user is stale data, we need to wait
		// for the use effect to invalidate the query.
		if (!selected || user.id !== selected.id) return;
		updateAccount(selected.id, { ...selected, ...user });
	}, [user]);

	return null;
};
