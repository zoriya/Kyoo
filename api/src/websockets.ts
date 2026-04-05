import { getLogger } from "@logtape/logtape";
import type { TObject, TString } from "@sinclair/typebox";
import { eq } from "drizzle-orm";
import Elysia, { type TSchema, t } from "elysia";
import { auth } from "./auth";
import { updateProgress } from "./controllers/profiles/history";
import { getOrCreateProfile } from "./controllers/profiles/profile";
import { getVideos } from "./controllers/videos";
import { videos } from "./db/schema";

const logger = getLogger();

const actionMap = {
	ping: handler({
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
				if (!vid) return;

				logger.info("Preparing next video {videoId}", {
					videoId: vid.id,
				});
				const path = Buffer.from(vid.path, "utf8").toString("base64url");
				await fetch(
					new URL(
						`/video/${path}/prepare`,
						process.env.TRANSCODER_SERVER ?? "http://transcoder:7666",
					),
					{
						headers: {
							authorization: ws.data.headers.authorization!,
						},
					},
				);
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
		for (const perm of handler.permissions ?? []) {
			if (!ws.data.jwt.permissions.includes(perm)) {
				return ws.close(3000, `Missing permission: '${perm}'.`);
			}
		}
		await handler.message(ws as any, body as any);
	},
});

type Ws = Parameters<NonNullable<Parameters<typeof baseWs.ws>[1]["open"]>>[0];
function handler<Schema extends TSchema = TObject<{}>>(ret: {
	body?: Schema;
	permissions?: string[];
	message: (ws: Ws, body: Schema["static"]) => void | Promise<void>;
}) {
	return ret;
}
