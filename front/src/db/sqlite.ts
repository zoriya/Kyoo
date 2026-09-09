import type { PersistedCollectionPersistence } from "@tanstack/db-sqlite-persistence-core";

/**
 * Web: no local persistence (yet). The browser adapter needs wa-sqlite + OPFS
 * which we don't ship; the web client is always online anyways.
 */
export const createPersistence = (
	_name: string,
): PersistedCollectionPersistence | undefined => undefined;
