import type { TObject, TString } from "@sinclair/typebox";
import Elysia, { type TSchema, t } from "elysia";
import { verifyJwt } from "./auth";
import { updateProgress } from "./controllers/profiles/history";
import { getOrCreateProfile } from "./controllers/profiles/profile";
import { SeedHistory } from "./models/history";

const actionMap = {
	ping: handler({
		message(ws) {
			ws.send({ response: "pong" });
		},
	}),
	watch: handler({
		body: t.Omit(SeedHistory, ["playedDate"]),
		permissions: ["core.read"],
		async message(ws, body) {
			const profilePk = await getOrCreateProfile(ws.data.jwt.sub);

			const ret = await updateProgress(profilePk, [
				{ ...body, playedDate: null },
			]);
			ws.send(ret);
		},
	}),
};

const baseWs = new Elysia()
	.guard({
		headers: t.Object(
			{
				authorization: t.Optional(t.TemplateLiteral("Bearer ${string}")),
				"Sec-WebSocket-Protocol": t.Optional(
					t.Array(
						t.Union([t.Literal("kyoo"), t.TemplateLiteral("Bearer ${string}")]),
					),
				),
			},
			{ additionalProperties: true },
		),
	})
	.resolve(
		async ({
			headers: { authorization, "Sec-WebSocket-Protocol": wsProtocol },
			status,
		}) => {
			const auth =
				authorization ??
				(wsProtocol?.length === 2 &&
				wsProtocol[0] === "kyoo" &&
				wsProtocol[1].startsWith("Bearer ")
					? wsProtocol[1]
					: null);
			const bearer = auth?.slice(7);
			if (!bearer) {
				return status(403, {
					status: 403,
					message: "No authorization header was found.",
				});
			}
			try {
				return await verifyJwt(bearer);
			} catch (err) {
				return status(403, {
					status: 403,
					message: "Invalid jwt. Verification vailed",
					details: err,
				});
			}
		},
	);

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
