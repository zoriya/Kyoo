import { createContext } from "react";
import type { Account, Token } from "~/models";

export const AccountContext = createContext<{
	apiUrl: string;
	authToken: Token | null;
	selectedAccount: Account | null;
	accounts: (Account & { select: () => void; remove: () => void })[];
}>({ apiUrl: "api", authToken: null, selectedAccount: null, accounts: [] });
