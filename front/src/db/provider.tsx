import { DbProvider } from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAccount, useToken } from "~/providers/account-context";
import { createDbClient } from "./client";
import { DbEventsListener } from "./events-listener";
import { createPersistence } from "./sqlite";

/**
 * One `DbClient` (and therefore one set of collections) per account/server.
 * Token refreshes and language changes are read live and do not recreate it.
 */
export const KyooDbProvider = ({ children }: { children: ReactNode }) => {
	const queryClient = useQueryClient();
	const { apiUrl, authToken } = useToken();
	const accountId = useAccount()?.id ?? "guest";
	const { i18n } = useTranslation();

	const live = useRef({ authToken, lang: i18n.resolvedLanguage ?? "en" });
	live.current.authToken = authToken;
	live.current.lang = i18n.resolvedLanguage ?? "en";

	const client = useMemo(
		() =>
			createDbClient({
				apiUrl,
				queryClient,
				persistence: createPersistence(accountId),
				authToken: () => live.current.authToken,
				lang: () => live.current.lang,
			}),
		[apiUrl, accountId, queryClient],
	);

	useEffect(() => {
		return () => {
			void client.cleanup();
		};
	}, [client]);

	return (
		<DbProvider client={client}>
			<DbEventsListener />
			{children}
		</DbProvider>
	);
};
