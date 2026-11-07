import {
	createContext,
	type ReactNode,
	Suspense,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { View } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { KyooDataProvider, useFetch } from "~/data";
import { type Account, User } from "~/models";
import { AccountContext, AccountsContext } from "~/providers/account-context";
import { useQueryState } from "~/utils";

type CastSession = {
	id: string;
	apiUrl: string;
	token: string | null;
};
let current: CastSession | null = null;

export const startCastSession = (apiUrl: string, token: string | null) => {
	if (current?.apiUrl === apiUrl && current.token === token) return current.id;
	current = { id: uuidv4(), apiUrl, token };
	return current.id;
};

const CasterContext = createContext<Account | null>(null);

export const useCaster = () => useContext(CasterContext);

export const CastSessionProvider = ({ children }: { children: ReactNode }) => {
	const [caster] = useQueryState<string | undefined>("caster", undefined);
	const session = caster && current?.id === caster ? current : null;

	// do not keep the caster's token around once their cast is left
	useEffect(() => {
		if (!session) return;
		return () => {
			if (current === session) current = null;
		};
	}, [session]);

	if (!session) return children;
	return (
		<KyooDataProvider key={session.id}>
			<AccountContext.Provider
				value={{ apiUrl: session.apiUrl, authToken: session.token }}
			>
				<Suspense fallback={<View className="flex-1 bg-black" />}>
					<CasterAccount session={session}>{children}</CasterAccount>
				</Suspense>
			</AccountContext.Provider>
		</KyooDataProvider>
	);
};

const CasterAccount = ({
	session: { apiUrl, token },
	children,
}: {
	session: CastSession;
	children: ReactNode;
}) => {
	const user = useFetch({
		path: ["auth", "users", "me"],
		schema: User,
		enabled: !!token,
	});
	const accounts = useContext(AccountsContext);
	const value = useMemo(
		() => ({
			selectedAccount: user && token ? { ...user, apiUrl, token, selected: true } : null,
			accounts: accounts.accounts
		}),
		[token, apiUrl, accounts],
	);
	return (
		<AccountsContext.Provider value={value}>
			<CasterContext.Provider value={token ? value.selectedAccount : null}>
				{children}
			</CasterContext.Provider>
		</AccountsContext.Provider>
	);
};
