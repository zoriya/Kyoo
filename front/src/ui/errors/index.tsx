import type { FC } from "react";
import type { KyooError } from "~/models";
import { ConnectionError } from "./connection";
import { OfflineView } from "./offline";
// import { SetupPage } from "./setup";
import { Unauthorized } from "./unauthorized";

export * from "./error";
export * from "./empty";

export type ErrorHandler = {
	view: FC<{ error: KyooError; retry: () => void }>;
	forbid?: string;
};

export const errorHandlers: Record<string, ErrorHandler> = {
	unauthorized: { view: Unauthorized, forbid: "app" },
	// setup: { view: SetupPage, forbid: "setup" },
	connection: { view: ConnectionError },
	offline: { view: OfflineView },
};
