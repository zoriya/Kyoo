import { DataProvider, getDefaultManagers } from "@data-client/react";
import { type ReactNode, useState } from "react";

export const KyooDataProvider = ({ children }: { children: ReactNode }) => {
	const [managers] = useState(() =>
		getDefaultManagers({
			networkManager: { dataExpiryLength: 300_000 },
		}),
	);

	return (
		<DataProvider managers={managers} devButton="bottom-right">
			{children}
		</DataProvider>
	);
};
