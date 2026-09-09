import { getLogger } from "@logtape/logtape";

const logger = getLogger();

/**
 * Change notifications pushed to connected clients (see `websockets.ts`).
 *
 * Clients keep a local copy of the resources they displayed; an event tells
 * them which rows changed so they can patch or re-fetch them instead of
 * guessing which routes are now stale. Payloads stay small: ids for things
 * the client can re-fetch on its own, data only for what it can't (there is
 * no `GET /entries/:id`).
 */
export type KyooEvent =
	| {
			collection: "shows";
			/** Re-fetch those shows if you have them. */
			op: "invalidate";
			ids: string[];
	  }
	| { collection: "shows"; op: "delete"; ids: string[] }
	| {
			collection: "entries";
			op: "update";
			data: {
				id: string;
				progress: {
					percent: number;
					time: number;
					playedDate: Date | null;
					videoId: string | null;
				};
			}[];
	  };

type Socket = { send: (data: unknown) => unknown };

// NOTE: in-process registry, events are only delivered to sockets connected
// to this api instance. Replace with a pg NOTIFY / redis fan-out when the api
// is scaled horizontally.
const sockets = new Map<string, Set<Socket>>();

export const registerSocket = (userId: string, ws: Socket) => {
	let set = sockets.get(userId);
	if (!set) {
		set = new Set();
		sockets.set(userId, set);
	}
	set.add(ws);
};

export const unregisterSocket = (userId: string, ws: Socket) => {
	const set = sockets.get(userId);
	if (!set) return;
	set.delete(ws);
	if (set.size === 0) sockets.delete(userId);
};

/**
 * Deliver an event to every socket of `userId` (user scoped data such as
 * watch status/progress), or to everybody when `userId` is null.
 */
export const publish = (event: KyooEvent, userId: string | null = null) => {
	const message = { action: "event", ...event };
	const targets =
		userId === null
			? [...sockets.values()].flatMap((x) => [...x])
			: [...(sockets.get(userId) ?? [])];
	for (const ws of targets) {
		try {
			ws.send(message);
		} catch (e) {
			logger.warn("Failed to push event to a websocket: {err}", { err: e });
		}
	}
};
