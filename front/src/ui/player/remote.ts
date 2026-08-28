import { useCallback } from "react";
import { useTVEventHandler } from "react-native";

export type RemoteKey =
	| "up"
	| "down"
	| "left"
	| "right"
	| "select"
	| "playPause"
	| "rewind"
	| "fastForward";

const keys: Record<string, RemoteKey> = {
	up: "up",
	down: "down",
	left: "left",
	right: "right",
	select: "select",
	playPause: "playPause",
	rewind: "rewind",
	skipBackward: "rewind",
	fastForward: "fastForward",
	skipForward: "fastForward",
};

// Every press of the remote, focused view or not. The player needs them raw: a
// remote has no pointer to wake the controls with, and the media keys have to
// work whether or not anything on screen is selected.
export const useRemote = (handler: (key: RemoteKey) => void) => {
	useTVEventHandler(
		useCallback(
			(event: { eventType: string }) => {
				const key = keys[event.eventType];
				if (key) handler(key);
			},
			[handler],
		),
	);
};
