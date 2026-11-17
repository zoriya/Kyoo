import { DataProvider, getDefaultManagers } from "@data-client/react";
import { type ReactNode, useState } from "react";
import {
	persistGcPolicy,
	persistManagers,
	readPersistedState,
} from "./persist";

export const KyooDataProvider = ({
	persist = true,
	children,
}: {
	persist?: boolean;
	children: ReactNode;
}) => {
	const [initialState] = useState(() =>
		persist ? readPersistedState() : undefined,
	);
	const [gcPolicy] = useState(() => (persist ? persistGcPolicy() : undefined));

	return (
		<DataProvider
			managers={() => [
				...getDefaultManagers({
					networkManager: { dataExpiryLength: 300_000 },
				}),
				...(persist ? persistManagers() : []),
			]}
			initialState={initialState}
			gcPolicy={gcPolicy}
			devButton="bottom-right"
		>
			{children}
		</DataProvider>
	);
};
