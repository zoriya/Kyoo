import { createContext, useContext } from "react";
import type { Account } from "~/models";

export const AccountContext = createContext<{
	apiUrl: string;
	authToken: string | null;
	selectedAccount: Account | null;
	accounts: (Account & { select: () => void; remove: () => void })[];
}>({ apiUrl: "", authToken: null, selectedAccount: null, accounts: [] });

export const useToken = () => {
	const { apiUrl, authToken } = useContext(AccountContext);
	return { apiUrl, authToken };
};

export const useAccount = () => {
	const { selectedAccount } = useContext(AccountContext);
	return selectedAccount;
};

export const useAccounts = () => {
	const { accounts } = useContext(AccountContext);
	return accounts;
};
