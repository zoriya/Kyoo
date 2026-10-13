import { QueryClientProvider } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { View } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { User } from "~/models";
import { AccountContext, AccountsContext } from "~/providers/account-context";
import { createQueryClient, useFetch } from "~/query";
import { useQueryState } from "~/utils";

// android tv: someone casted to us. the player plays with their account instead of
// ours (their server, permissions, watch status...). only kept in memory, the
// `caster` query param of the watch page references it.
let current: {
	id: string;
	apiUrl: string;
	token: string | null;
	queryClient: ReturnType<typeof createQueryClient>;
} | null = null;

export const startCastSession = (apiUrl: string, token: string | null) => {
	// a separate cache, the caster could be another user of our server
	current = { id: uuidv4(), apiUrl, token, queryClient: createQueryClient() };
	return current.id;
};

const CasterContext = createContext<User | null>(null);

export const useCaster = () => useContext(CasterContext);

export const CastSessionProvider = ({ children }: { children: ReactNode }) => {
	const [caster] = useQueryState<string | undefined>("caster", undefined);
	const session = caster && current?.id === caster ? current : null;
	const auth = useMemo(
		() => session && { apiUrl: session.apiUrl, authToken: session.token },
		[session],
	);

	if (!session || !auth) return children;
	return (
		<QueryClientProvider client={session.queryClient}>
			<AccountContext.Provider value={auth}>
				<CasterAccount apiUrl={session.apiUrl} token={session.token}>
					{children}
				</CasterAccount>
			</AccountContext.Provider>
		</QueryClientProvider>
	);
};

const CasterAccount = ({
	apiUrl,
	token,
	children,
}: {
	apiUrl: string;
	token: string | null;
	children: ReactNode;
}) => {
	const { accounts } = useContext(AccountsContext);
	const { data: user, isLoading } = useFetch({
		path: ["auth", "users", "me"],
		parser: User,
		enabled: !!token,
		options: { returnError: true },
	});
	const value = useMemo(
		() => ({
			selectedAccount:
				user && token ? { ...user, apiUrl, token, selected: true } : null,
			accounts,
		}),
		[user, apiUrl, token, accounts],
	);

	// the player reads the account's settings (languages, chapter skip...) on mount
	if (isLoading) return <View className="flex-1 bg-black" />;
	return (
		<AccountsContext.Provider value={value}>
			<CasterContext.Provider value={user ?? null}>
				{children}
			</CasterContext.Provider>
		</AccountsContext.Provider>
	);
};
