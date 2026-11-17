import type { GCInterface, Manager, State } from "@data-client/react";

export const readPersistedState = (): State<unknown> | undefined => undefined;
export const persistManagers = (): Manager[] => [];
export const persistGcPolicy = (): GCInterface | undefined => undefined;
