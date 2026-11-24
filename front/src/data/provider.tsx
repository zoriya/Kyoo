import { DataProvider, getDefaultManagers } from "@data-client/react";
import { type ReactNode, useMemo } from "react";
import { z } from "zod/v4";
import { Account } from "~/models";
import { useStoreValue } from "~/providers/settings";
import {
	persistGcPolicy,
	persistManagers,
	readPersistedState,
	storeKey,
} from "./persist";

const Accounts = z.array(Account);

export const KyooDataProvider = ({
	persist = true,
	children,
}: {
	persist?: boolean;
	children: ReactNode;
}) => {
	const accounts = useStoreValue("accounts", Accounts) ?? [];
	const key = persist
		? storeKey(accounts.find((x) => x.selected) ?? accounts[0])
		: null;
	// only read by the DataProvider when it mounts, when the account changes
	const initialState = useMemo(
		() => (key ? readPersistedState(key) : undefined),
		[key],
	);
	const gcPolicy = useMemo(() => (key ? persistGcPolicy() : undefined), [key]);

	// each account has its own store, switching account remounts everything
	return (
		<DataProvider
			key={key}
			managers={() => [
				...getDefaultManagers({
					networkManager: { dataExpiryLength: 300_000 },
				}),
				...(key ? persistManagers(key) : []),
			]}
			initialState={initialState}
			gcPolicy={gcPolicy}
			devButton="bottom-right"
		>
			{children}
		</DataProvider>
	);
};
