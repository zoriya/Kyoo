import { persistedCollectionOptions } from "@tanstack/db-sqlite-persistence-core";
import type { CollectionConfig, DbClient } from "@tanstack/react-db";
import { getDeps } from "./client";

/**
 * Wrap a synced collection config with local persistence when the client has
 * a persistence adapter (sqlite on android/ios), or return it untouched.
 */
export const withPersistence = <
	TConfig extends CollectionConfig<any, any, any, any>,
>(
	client: DbClient,
	config: TConfig,
): TConfig => {
	const { persistence } = getDeps(client);
	if (!persistence) return config;
	return persistedCollectionOptions({
		...config,
		persistence,
	}) as unknown as TConfig;
};
