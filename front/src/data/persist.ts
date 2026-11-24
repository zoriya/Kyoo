import type { GCInterface, Manager, State } from "@data-client/react";

export const storeKey = (account?: { apiUrl: string; id: string }) =>
	`${account?.apiUrl} ${account?.id}`;
export const removePersistedState = (_key: string) => {};
export const readPersistedState = (_key: string): State<unknown> | undefined =>
	undefined;
export const persistManagers = (_key: string): Manager[] => [];
export const persistGcPolicy = (): GCInterface | undefined => undefined;
