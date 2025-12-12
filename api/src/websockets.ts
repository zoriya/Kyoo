import Elysia, { t } from "elysia";

const actionMap: Record<string, ][> = [

]

export const appWs = new Elysia().ws("/ws", {
	body: t.Union([
		t.Object({
			action: t.Literal("ping"),
		}),
		t.Object({
			action: t.Literal("watch"),
			entry: t.String(),
		}),
	]),
	message(ws, { message }) {
		actionMap[message.action](message);
	},
});
