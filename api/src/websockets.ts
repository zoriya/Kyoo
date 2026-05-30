import { getLogger } from "@logtape/logtape";
import type { TObject, TString } from "@sinclair/typebox";
import { eq } from "drizzle-orm";
import Elysia, { type TSchema, t } from "elysia";
import { auth, verifyJwt } from "./auth";
import { updateProgress } from "./controllers/profiles/history";
import { getOrCreateProfile } from "./controllers/profiles/profile";
import { prepareVideo } from "./controllers/video-metadata";
import { getVideos } from "./controllers/videos";
import { videos } from "./db/schema";
import { syncRealtimeWatchEvent } from "./watch-sync/watch-syncer";

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

			const ret = await updateProgress(
				profilePk,
				[{ ...body, playedDate: null }],
				{
					userId: ws.data.jwt.sub,
					authorization: ws.data.headers.authorization!,
					syncBackends: false,
				},
			);

			ws.send({ action: "watch", ...ret });

			if (ret.status !== 201) return;

			const old = ret.history.existing.find((x) => x.videoId === body.videoId);
			if (!old) return;

			await syncRealtimeWatchEvent({
				profilePk,
				userId: ws.data.jwt.sub,
				authorization: ws.data.headers.authorization!,
				videoId: body.videoId,
				fromPercent: old.percent,
				toPercent: body.percent,
			});

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
		}
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
	message: (ws: Ws, body: Schema["static"]) => void | Promise<void>;
}) {
	return ret;
}
