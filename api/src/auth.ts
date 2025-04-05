import { TypeCompiler } from "@sinclair/typebox/compiler";
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

const Jwt = t.Object({
	sub: t.String({ description: "User id" }),
	username: t.String(),
	sid: t.String({ description: "Session id" }),
	permissions: t.Array(t.String()),
});
const validator = TypeCompiler.Compile(Jwt);

export const auth = new Elysia({ name: "auth" })
	.macro({
		permissions(perms: string[]) {
			return {
				resolve: async ({ headers: { authorization }, error }) => {
					const bearer = authorization?.slice(7);
					if (!bearer) {
						return error(500, {
							status: 500,
							message: "No jwt, auth server configuration error.",
						});
					}

					// @ts-expect-error ts can't understand that there's two overload idk why
					const { payload } = await jwtVerify(bearer, jwtSecret ?? jwks, {
						issuer: process.env.JWT_ISSUER,
					});
					const jwt = validator.Decode(payload);

					for (const perm of perms) {
						if (!jwt.permissions.includes(perm)) {
							return error(403, {
								status: 403,
								message: `Missing permission: '${perm}'.`,
								details: { current: jwt.permissions, required: perms },
							});
						}
					}

					return { jwt };
				},
			};
		},
	})
	.as("plugin");
