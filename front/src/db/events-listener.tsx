import { useDbClient } from "@tanstack/react-db";
import { useEffect, useMemo } from "react";
import { useAccount } from "~/providers/account-context";
import { useWebsockets } from "~/query/websockets";
import { createEventHandler } from "./events";

const Listener = () => {
	const client = useDbClient();
	const handle = useMemo(() => createEventHandler(client), [client]);
	const { lastJsonMessage } = useWebsockets({ filterActions: ["event"] });

	useEffect(() => {
		if (lastJsonMessage) handle(lastJsonMessage);
	}, [lastJsonMessage, handle]);

	return null;
};

/** Keeps the local db in sync with the server through websocket events. */
export const DbEventsListener = () => {
	// The websocket requires an authenticated user.
	const account = useAccount();
	if (!account) return null;
	return <Listener />;
};
