import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";

export let jwtSecret = process.env.JWT_SECRET!;
if (!jwtSecret) {
	const auth = process.env.AUTH_SERVER ?? "http://auth:4568/auth";
	try {
		const ret = await fetch(`${auth}/info`);
		const info = await ret.json();
		jwtSecret = info.publicKey;
	} catch (error) {
		console.error(`Can't access auth server at ${auth}:\n${error}`);
	}
}

export const auth = new Elysia({ name: "auth" })
	.use(jwt({ secret: jwtSecret }))
	.guard({
		headers: t.Object({
			authorization: t.String({ pattern: "^Bearer .+$" }),
		}),
	})
	.macro({
		permissions(perms: string[]) {
			return {
				beforeHandle: () => {},
				resolve: async ({ headers: { authorization }, jwt }) => {
					console.log(authorization.slice(7));
					const user = await jwt.verify(authorization?.slice(7));
					console.log("macro", user);
					return { user };
				},
			};
		},
	})
	.as("plugin");
