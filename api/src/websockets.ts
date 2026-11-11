import { getLogger } from "@logtape/logtape";
import type { TObject, TString } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { Value } from "@sinclair/typebox/value";
import type { Server } from "bun";
import { eq, sql } from "drizzle-orm";
import Elysia, { type TSchema, t } from "elysia";
import type { PoolClient } from "pg";
import { auth, verifyJwt } from "./auth";
import { updateProgress } from "./controllers/profiles/history";
import { getOrCreateProfile } from "./controllers/profiles/profile";
import { prepareVideo } from "./controllers/video-metadata";
import { getVideos } from "./controllers/videos";
import { db, type Transaction } from "./db";
import { profiles, videos } from "./db/schema";
import { sqlarr } from "./db/utils";
import { Progress } from "./models/history";
import { Resource } from "./models/utils";
import { MovieWatchStatus, SerieWatchStatus } from "./models/watchlist";
import { record } from "./otel";

const logger = getLogger();

const actionMap = {
	ping: handler({
		skipRefresh: true,
		message(ws) {
			ws.send({ action: "ping", response: "pong" });
		},
	}),
	watch: handler({
		body: t.Object({
			percent: t.Integer({ minimum: 0, maximum: 100 }),
			time: t.Integer({
				minimum: 0,
			}),
			videoId: t.String({
				format: "uuid",
			}),
			entry: t.String(),
		}),
		permissions: ["core.read"],
		name: (body) => `watch/${body.entry}`,
		async message(ws, body) {
			const profilePk = await getOrCreateProfile(ws.data.jwt.sub);
			if (!profilePk) {
				ws.send({
					action: "watch",
					status: 401,
					message: "Guest can't set watchstatus",
				});
				return;
			}

			const ret = await updateProgress(profilePk, [
				{ ...body, playedDate: null },
			]);

			ws.send({ action: "watch", ...ret });

			if (ret.status !== 201) return;

			const old = ret.history.existing.find((x) => x.videoId === body.videoId);
			if (!old) return;

			if (
				(old.percent < 50 && body.percent >= 50) ||
				(old.percent < 75 && body.percent >= 75)
			) {
				const [vid] = await getVideos({
					filter: eq(videos.id, body.videoId),
					limit: 1,
					relations: ["next"],
					languages: ["*"],
					userId: ws.data.jwt.sub,
				});
				const next = vid?.next?.video;
				if (!next) {
					logger.info("No next video to prepare for ${slug}", {
						slug: vid.path,
					});
					return;
				}
				await prepareVideo(next, ws.data.headers.authorization!);
			}
		},
	}),
};

const baseWs = new Elysia().use(auth);

export const appWs = baseWs.ws("/ws", {
	body: t.Union(
		Object.entries(actionMap).map(([k, v]) =>
			t.Intersect([t.Object({ action: t.Literal(k) }), v.body ?? t.Object({})]),
		),
	) as unknown as TObject<{ action: TString }>,
	async open(ws) {
		if (!ws.data.jwt.sub) {
			ws.close(3000, "Unauthorized");
			return;
		}
		ws.subscribe(`user:${ws.data.jwt.sub}`);
		if (ws.data.jwt.permissions.includes("core.read")) ws.subscribe("events");
	},
	async message(ws, { action, ...body }) {
		const handler = actionMap[action as keyof typeof actionMap];

		if (!handler.skipRefresh) {
			try {
				const resp = await fetch(
					new URL("/auth/jwt", process.env.AUTH_SERVER ?? "http://auth:4568"),
					{
						headers: {
							Authorization: ws.data.headers.authorization!,
						},
					},
				);
				if (resp.ok) {
					const data = (await resp.json()) as { token?: string };
					if (data.token) {
						const ret = await verifyJwt(data.token);
						ws.data.jwt = ret.jwt as typeof ws.data.jwt;
						ws.data.headers.authorization =
							`Bearer ${data.token}` as typeof ws.data.headers.authorization;
					}
				}
			} catch (e) {
				logger.error("Failed to refresh jwt: {err}", { err: e });
				// If refresh fails, continue with the old JWT
			}
		}

		if (ws.data.jwt.wsRoutes && handler.permissions) {
			const route = handler.name?.(body as any) ?? action;
			if (!ws.data.jwt.wsRoutes.includes(route)) {
				ws.send({
					action,
					status: 403,
					message: `Not allowed to use the '${route}' route.`,
				});
				return;
			}
		}

		for (const perm of handler.permissions ?? []) {
			if (!ws.data.jwt.permissions.includes(perm)) {
				ws.send({
					action: action,
					status: 403,
					message: `Missing permission: '${perm}'.`,
				});
				return;
			}
		}
		await handler.message(ws as any, body as any);
	},
});

type Ws = Parameters<NonNullable<Parameters<typeof baseWs.ws>[1]["open"]>>[0];
function handler<Schema extends TSchema = TObject<{}>>(ret: {
	body?: Schema;
	permissions?: string[];
	skipRefresh?: boolean;
	name?: (body: Schema["static"]) => string;
	message: (ws: Ws, body: Schema["static"]) => void | Promise<void>;
}) {
	return ret;
}
const channel = "kyoo_events";

export const Event = t.Union([
	t.Object({
		action: t.UnionEnum(["created", "updated", "deleted"]),
		kind: t.UnionEnum(["movie", "serie", "collection"]),
		id: t.String({ format: "uuid" }),
		slug: t.String({ format: "slug" }),
	}),
	t.Object({
		action: t.UnionEnum(["created", "updated", "deleted"]),
		kind: t.Literal("video"),
		id: t.String({ format: "uuid" }),
		path: t.String(),
	}),
	t.Object({
		action: t.UnionEnum(["created", "deleted"]),
		kind: t.Literal("video-link"),
		slug: t.String(),
		show: Resource(),
		entry: Resource(),
		video: t.Object({
			id: t.String({ format: "uuid" }),
			path: t.String(),
		}),
	}),
]);
export type Event = typeof Event.static;
const EventC = TypeCompiler.Compile(Event);

const ShowRef = t.Object({
	kind: t.UnionEnum(["movie", "serie"]),
	id: t.String({ format: "uuid" }),
	slug: t.String({ format: "slug" }),
});

// only sent to the websockets of the user they are about.
export const UserEvent = t.Union([
	t.Object({
		action: t.UnionEnum(["created", "updated"]),
		kind: t.Literal("watchstatus"),
		show: ShowRef,
		watchStatus: t.Intersect([SerieWatchStatus, MovieWatchStatus]),
	}),
	t.Object({
		action: t.Literal("deleted"),
		kind: t.Literal("watchstatus"),
		show: ShowRef,
	}),
	t.Object({
		action: t.UnionEnum(["created", "updated"]),
		kind: t.Literal("progress"),
		entry: Resource(),
		show: ShowRef,
		progress: Progress,
	}),
]);
export type UserEvent = typeof UserEvent.static;
const UserEventC = TypeCompiler.Compile(UserEvent);

// goes through postgres so every replica of the api forwards it to its websockets.
export const broadcast = async (tx: Transaction, events: Event | Event[]) => {
	const payloads = [events].flat().map((x) => JSON.stringify(x));
	if (!payloads.length) return;
	await tx.execute(
		sql`select pg_notify(${channel}, payload) from unnest(${sqlarr(payloads)}::text[]) as payload`,
	);
};

export const notify = async (
	tx: Transaction,
	userPk: number,
	events: UserEvent | UserEvent[],
) => {
	const payloads = [events].flat().map((x) => JSON.stringify(x));
	if (!payloads.length) return;
	await tx.execute(
		sql`
			select pg_notify(${channel}, (payload::jsonb || jsonb_build_object('__user', ${profiles.id}))::text)
			from unnest(${sqlarr(payloads)}::text[]) as payload
			cross join ${profiles}
			where ${profiles.pk} = ${userPk}
		`,
	);
};

export const listenBroadcasts = record(
	"listenBroadcasts",
	async (server: Pick<Server<unknown>, "publish">) => {
		const client = (await db.$client.connect()) as PoolClient;
		client.on("notification", (evt) => {
			if (evt.channel !== channel || !evt.payload) return;
			const { __user, ...raw } = JSON.parse(evt.payload);
			const event = Value.Clean(__user ? UserEvent : Event, raw);
			const validator = __user ? UserEventC : EventC;
			if (!validator.Check(event)) {
				logger.error("Dropping invalid event {event}: {errors}", {
					event,
					errors: [...validator.Errors(event)],
				});
				return;
			}
			server.publish(
				__user ? `user:${__user}` : "events",
				JSON.stringify(event),
			);
		});
		await client.query(`listen ${channel}`);
		return () => client.release(true);
	},
);
