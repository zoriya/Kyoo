import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { ReadyState } from "react-use-websocket";
import { useToken } from "~/providers/account-context";
import { useWebsockets } from "./websockets";

const OfflineContext = createContext(false);

export const useIsOffline = () => useContext(OfflineContext);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
	const { apiUrl } = useToken();
	const { readyState } = useWebsockets({
		filterActions: [],
		enabled: apiUrl !== "",
	});
	const connected = readyState === ReadyState.OPEN;

	const [offline, setOffline] = useState(false);
	useEffect(() => {
		if (connected) {
			setOffline(false);
			return;
		}
		const timer = setTimeout(() => setOffline(true), 7_000);
		return () => clearTimeout(timer);
	}, [connected]);

	return (
		<OfflineContext.Provider value={offline}>
			{children}
		</OfflineContext.Provider>
	);
};
