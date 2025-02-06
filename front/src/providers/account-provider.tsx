import { type ReactNode, createContext, useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { z } from "zod";
import { type Account, AccountP, type Token, type User, UserP } from "~/models";
import { useFetch } from "~/query";
import { removeAccounts, updateAccount } from "./account-store";
import { useSetError } from "./error-provider";
import { useStoreValue } from "./settings";

const AccountContext = createContext<{
	apiUrl: string;
	authToken: Token;
	selectedAccount?: Account;
	accounts: (Account & { select: () => void; remove: () => void })[];
}>(undefined!);

export const AccountProvider = ({
	children,
	ssrAccount,
}: {
	children: ReactNode;
	ssrAccount?: Account;
}) => {
	if (Platform.OS === "web" && typeof window === "undefined") {
		const accounts = ssrAccount
			? [{ ...ssrAccount, selected: true, select: () => {}, remove: () => {} }]
			: [];

		return (
			<AccountContext.Provider value={{ ...ssrAccount, accounts }}>
				{children}
			</AccountContext.Provider>
		);
	}

	const setError = useSetError();
	const accounts = useStoreValue("accounts", z.array(AccountP)) ?? [];

	const ret = useMemo(() => {
		const acc = accounts.find((x) => x.selected);
		return {
			apiUrl: Platform.OS === "web" ? "/api" : acc?.apiUrl,
			authToken: acc?.token,
			selectedAccount: acc,
			accounts: accounts.map((account) => ({
				...account,
				select: () => updateAccount(account.id, { ...account, selected: true }),
				remove: () => removeAccounts((x) => x.id === account.id),
			})),
		};
	}, [accounts]);

	// update user's data from kyoo on startup, it could have changed.
	const {
		isSuccess: userIsSuccess,
		isError: userIsError,
		isLoading: userIsLoading,
		isPlaceholderData: userIsPlaceholder,
		data: user,
		error: userError,
	} = useFetch({
		path: ["auth", "me"],
		parser: UserP,
		placeholderData: ret.selectedAccount,
		enabled: !!ret.selectedAccount,
		options: {
			apiUrl: ret.apiUrl,
			authToken: ret.authToken?.access_token,
		},
	});
	// Use a ref here because we don't want the effect to trigger when the selected
	// value has changed, only when the fetch result changed
	// If we trigger the effect when the selected value change, we enter an infinite render loop
	const selectedRef = useRef(selected);
	selectedRef.current = selected;
	useEffect(() => {
		if (!selectedRef.current || !userIsSuccess || userIsPlaceholder) return;
		// The id is different when user is stale data, we need to wait for the use effect to invalidate the query.
		if (user.id !== selectedRef.current.id) return;
		const nUser = { ...selectedRef.current, ...user };
		updateAccount(nUser.id, nUser);
	}, [user, userIsSuccess, userIsPlaceholder]);

	const queryClient = useQueryClient();
	const oldSelected = useRef<{ id: string; token: string } | null>(
		selected ? { id: selected.id, token: selected.token.access_token } : null,
	);

	const [permissionError, setPermissionError] = useState<KyooErrors | null>(null);

	useEffect(() => {
		// if the user change account (or connect/disconnect), reset query cache.
		if (
			// biome-ignore lint/suspicious/noDoubleEquals: id can be an id, null or undefined
			selected?.id != oldSelected.current?.id ||
			(userIsError && selected?.token.access_token !== oldSelected.current?.token)
		) {
			setPermissionError(null);
			queryClient.resetQueries();
		}
		oldSelected.current = selected ? { id: selected.id, token: selected.token.access_token } : null;

		// update cookies for ssr (needs to contains token, theme, language...)
		if (Platform.OS === "web") {
			setCookie("account", selected);
			// cookie used for images and videos since we can't add Authorization headers in img or video tags.
			setCookie("X-Bearer", selected?.token.access_token);
		}
	}, [selected, queryClient, userIsError]);
	// <ConnectionErrorContext.Provider
	// 	value={{
	// 		error: (selected ? (userError) : null) ?? permissionError,
	// 		loading: userIsLoading,
	// 		retry: () => {
	// 			queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
	// 		},
	// 		setError: setPermissionError,
	// 	}}

	return <AccountContext.Provider value={ret}>{children}</AccountContext.Provider>;
};
