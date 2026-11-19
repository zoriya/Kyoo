import { DataProvider, getDefaultManagers } from "@data-client/react";
import type { ReactNode } from "react";

const managers = () =>
	getDefaultManagers({
		networkManager: { dataExpiryLength: 300_000 },
	});

export const KyooDataProvider = ({ children }: { children: ReactNode }) => {
	return (
		<DataProvider managers={managers} devButton="bottom-right">
			{children}
		</DataProvider>
	);
};
