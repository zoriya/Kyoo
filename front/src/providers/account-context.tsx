import { createContext, useContext } from "react";
import { ServerInfoP, type Account, type Token } from "~/models";
import { useFetch } from "~/query";

export const AccountContext = createContext<{
	apiUrl: string;
	authToken: Token | null;
	selectedAccount: Account | null;
	accounts: (Account & { select: () => void; remove: () => void })[];
}>({ apiUrl: "api", authToken: null, selectedAccount: null, accounts: [] });

export const useAccount = () => {
	const { selectedAccount } = useContext(AccountContext);
	return selectedAccount;
};

export const useAccounts = () => {
	const { accounts } = useContext(AccountContext);
	return accounts;
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
