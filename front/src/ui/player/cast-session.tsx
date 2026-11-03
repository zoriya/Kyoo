import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { View } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { type Account, User } from "~/models";
import { AccountContext, AccountsContext } from "~/providers/account-context";
import { createQueryClient, useFetch } from "~/query";
import { useQueryState } from "~/utils";

type CastSession = {
	id: string;
	apiUrl: string;
	token: string | null;
	queryClient: ReturnType<typeof createQueryClient>;
};
let current: CastSession | null = null;

export const startCastSession = (apiUrl: string, token: string | null) => {
	if (current?.apiUrl === apiUrl && current.token === token) return current.id;
	current = { id: uuidv4(), apiUrl, token, queryClient: createQueryClient() };
	return current.id;
};

const CasterContext = createContext<Account | null>(null);

export const useCaster = () => useContext(CasterContext);

export const CastSessionProvider = ({ children }: { children: ReactNode }) => {
	const [caster] = useQueryState<string | undefined>("caster", undefined);
	const session = caster && current?.id === caster ? current : null;
	const queryClient = useQueryClient();
	const account = useContext(AccountContext);
	const auth = useMemo(
		() =>
			session ? { apiUrl: session.apiUrl, authToken: session.token } : account,
		[session, account],
	);
	// do not keep the caster's token around once their cast is left
	useEffect(() => {
		if (!session) return;
		return () => {
			if (current === session) current = null;
		};
	}, [session]);

	return (
		<QueryClientProvider client={session?.queryClient ?? queryClient}>
			<AccountContext.Provider value={auth}>
				<CasterAccount session={session}>{children}</CasterAccount>
			</AccountContext.Provider>
		</QueryClientProvider>
	);
};

const CasterAccount = ({
	session,
	children,
}: {
	session: CastSession | null;
	children: ReactNode;
}) => {
	const accounts = useContext(AccountsContext);
	const { data: user, isLoading } = useFetch({
		path: ["auth", "users", "me"],
		parser: User,
		enabled: !!session?.token,
		options: { returnError: true },
	});
	const value = useMemo(
		() =>
			session
				? {
						selectedAccount:
							user && session.token
								? {
										...user,
										apiUrl: session.apiUrl,
										token: session.token,
										selected: true,
									}
								: null,
						accounts: accounts.accounts,
					}
				: accounts,
		[session, user, accounts],
	);

	const [ready, setReady] = useState(!isLoading);
	if (!ready && !isLoading) setReady(true);
	if (!ready) return <View className="flex-1 bg-black" />;
	return (
		<AccountsContext.Provider value={value}>
			<CasterContext.Provider value={session ? value.selectedAccount : null}>
				{children}
			</CasterContext.Provider>
		</AccountsContext.Provider>
	);
};
