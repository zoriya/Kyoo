import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import { createRemoteJWKSet } from "jose";

const jwtSecret = process.env.JWT_SECRET;
const jwks = createRemoteJWKSet(
	new URL(process.env.AUTH_SERVER ?? "http://auth:4568"),
);

export const auth = new Elysia({ name: "auth" })
	.use(jwt({ secret: jwtSecret ?? jwks }))
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
					console.log(authorization?.slice(7));
					const user = await jwt.verify(authorization?.slice(7));
					console.log("macro", user);
					return { user };
				},
			};
		},
	})
	.as("plugin");
