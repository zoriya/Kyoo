import {
	createContext,
	type ReactNode,
	Suspense,
	useContext,
	useEffect,
	useEffectEvent,
} from "react";
import { View } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { KyooDataProvider, useDLE, usePrefill } from "~/data";
import { type Account, User, type Video, type VideoInfo } from "~/models";
import { AccountContext, AccountsContext } from "~/providers/account-context";
import { type Download, DownloadsContext } from "~/ui/downloads/download";
import { Info } from "~/ui/info";
import { useQueryState } from "~/utils";
import { Player } from ".";

type CastSession = {
	id: string;
	apiUrl: string;
	token: string | null;
	// the caster's download (served by it) & what goes with it. the server
	// might be unreachable.
	download: Download | null;
	user: User | null;
};
let current: CastSession | null = null;

export const startCastSession = (
	apiUrl: string,
	token: string | null,
	sent?: {
		slug: string;
		file: string;
		video: Video;
		info: VideoInfo;
		user: User | null;
	},
) => {
	// a new object so the provider sees it, the same id keeps its store
	current = {
		id:
			current?.apiUrl === apiUrl && current.token === token
				? current.id
				: uuidv4(),
		apiUrl,
		token,
		download: sent
			? {
					...sent,
					id: sent.video.id,
					apiUrl,
					owner: "caster",
					status: "done",
					quality: "original",
					size: null,
					createdAt: Date.now(),
					show: null,
				}
			: null,
		user: sent?.user ?? null,
	};
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
		<KyooDataProvider key={session.id} persist={false}>
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
	session: { apiUrl, token, user: caster, download },
	children,
}: {
	session: CastSession;
	children: ReactNode;
}) => {
	const { data } = useDLE(
		{ path: ["auth", "users", "me"], schema: User, enabled: !!token },
		{ returnError: true },
	);
	const user = data ?? caster;
	const accounts = useContext(AccountsContext);

	const [slug] = useQueryState<string>("slug", undefined!);
	const prefill = usePrefill();
	const run = useEffectEvent((slug: string, download: Download | null) => {
		if (download?.slug !== slug) return;
		prefill(Player.query(slug), download.video);
		prefill(Info.infoQuery(slug), download.info);
	});
	useEffect(() => run(slug, download), [slug, download]);

	const value = {
		selectedAccount:
			user && token ? { ...user, apiUrl, token, selected: true } : null,
		accounts: accounts.accounts,
	};
	return (
		<AccountsContext.Provider value={value}>
			<CasterContext.Provider value={token ? value.selectedAccount : null}>
				<DownloadsContext.Provider value={download ? [download] : []}>
					{children}
				</DownloadsContext.Provider>
			</CasterContext.Provider>
		</AccountsContext.Provider>
	);
};
