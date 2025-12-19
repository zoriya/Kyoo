import type { TObject, TString } from "@sinclair/typebox";
import Elysia, { type TSchema, t } from "elysia";
import { auth } from "./auth";
import { updateProgress } from "./controllers/profiles/history";
import { getOrCreateProfile } from "./controllers/profiles/profile";

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
			videoId: t.Nullable(
				t.String({
					format: "uuid",
				}),
			),
			entry: t.String(),
		}),
		permissions: ["core.read"],
		async message(ws, body) {
			const profilePk = await getOrCreateProfile(ws.data.jwt.sub);

			const ret = await updateProgress(profilePk, [
				{ ...body, playedDate: null },
			]);
			ws.send({ action: "watch", ...ret });
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
