import { DataProvider, getDefaultManagers } from "@data-client/react";
import { type ReactNode, useState } from "react";
import { persistManagers, readPersistedState } from "./persist";

const managers = () => [
	...getDefaultManagers({
		networkManager: { dataExpiryLength: 300_000 },
	}),
	...persistManagers(),
];

export const KyooDataProvider = ({ children }: { children: ReactNode }) => {
	const [initialState] = useState(readPersistedState);

	return (
		<DataProvider
			managers={managers}
			initialState={initialState}
			devButton="bottom-right"
		>
			{children}
		</DataProvider>
	);
};
