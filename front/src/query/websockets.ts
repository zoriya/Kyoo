import { useEffect } from "react";
import { Platform } from "react-native";
import useWebSocket from "react-use-websocket";
import { useToken } from "~/providers/account-context";

export const useWebsockets = ({
	filterActions,
}: {
	filterActions: string[];
}) => {
	const { apiUrl, authToken } = useToken();
	const ret = useWebSocket(`${apiUrl}/api/ws`, {
		// on web use cookies, firefox doesn't like protocols idk why
		protocols:
			Platform.OS !== "web" && authToken
				? ["kyoo", `Bearer ${authToken}`]
				: ["kyoo"],
		filter: (msg) => filterActions.includes(msg.data.action),
		share: true,
		retryOnError: true,
		heartbeat: {
			message: `{"action": "ping"}`,
			returnMessage: `{"action":"ping","response":"pong"}`,
			interval: 25_000,
		},
	});

	useEffect(() => {
		console.log(
			"websocket connected to:",
			`${apiUrl}/api/ws`,
			"status:",
			ret.readyState,
		);
	}, [apiUrl, ret.readyState]);

	return ret;
};
