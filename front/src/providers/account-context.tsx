import { createContext, useContext } from "react";
import type { Account } from "~/models";

// context needed by every image/fetch component. kept low to re-render as
// little as possible (in case of account edit for example)
export const AccountContext = createContext<{
	apiUrl: string;
	authToken: string | null;
}>({ apiUrl: "", authToken: null });

export const AccountsContext = createContext<{
	selectedAccount: Account | null;
	accounts: (Account & { select: () => void; remove: () => void })[];
}>({ selectedAccount: null, accounts: [] });

export const useToken = () => {
	return useContext(AccountContext);
};

export const useAccount = () => {
	return useContext(AccountsContext).selectedAccount;
};

export const useAccounts = () => {
	return useContext(AccountsContext).accounts;
};
