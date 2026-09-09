import type { PersistedCollectionPersistence } from "@tanstack/db-sqlite-persistence-core";
import {
	createExpoSQLitePersistence,
	type ExpoSQLiteDatabaseLike,
} from "@tanstack/expo-db-sqlite-persistence";
import { openDatabaseSync } from "expo-sqlite";

/**
 * Native: every collection is mirrored in a sqlite database so the app can
 * render (and queue mutations) without network. One database per account.
 */
export const createPersistence = (
	name: string,
): PersistedCollectionPersistence | undefined => {
	try {
		// expo-sqlite 57 types its bind params slightly differently than the adapter
		// (no optional undefined), the runtime api is the same.
		const database = openDatabaseSync(
			`kyoo-${name}.db`,
		) as unknown as ExpoSQLiteDatabaseLike;
		return createExpoSQLitePersistence({
			database,
			schemaMismatchPolicy: "reset",
		});
	} catch (e) {
		console.error(
			"[db] could not open the sqlite database, running in memory",
			e,
		);
		return undefined;
	}
};
