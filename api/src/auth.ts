import Elysia, { t } from "elysia";
import { createRemoteJWKSet, jwtVerify } from "jose";

const jwtSecret = process.env.JWT_SECRET
	? new TextEncoder().encode(process.env.JWT_SECRET)
	: null;
const jwks = createRemoteJWKSet(
	new URL(
		".well-known/jwks.json",
		process.env.AUTH_SERVER ?? "http://auth:4568",
	),
);

export const auth = new Elysia({ name: "auth" })
	.guard({
		headers: t.Object({
			authorization: t.String({ pattern: "^Bearer .+$" }),
		}),
	})
	.macro({
		permissions(perms: string[]) {
			return {
				beforeHandle: () => {},
				resolve: async ({ headers: { authorization } }) => {
					const bearer = authorization?.slice(7);
					if (!bearer) return { jwt: false };
					// @ts-expect-error ts can't understand that there's two overload idk why
					const { payload: jwt } = await jwtVerify(bearer, jwtSecret ?? jwks);
					return { jwt };
				},
			};
		},
	})
	.as("plugin");
