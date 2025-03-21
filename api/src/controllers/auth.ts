import Elysia, { t } from "elysia";
import { auth } from "~/auth";

export const authH = new Elysia({ tags: ["auth"] }).post(
	"users",
	async ({ body }) => {
		const ret = await auth.api.signInUsername({ body });
	},
	{
		detail: { description: "Register as a new user" },
		body: t.Object({
			username: t.String(),
			password: t.String(),
		}),
	},
);
