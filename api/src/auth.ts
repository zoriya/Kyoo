import Elysia, { getSchemaValidator, t } from "elysia";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { KError } from "./models/error";

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
});
const validator = getSchemaValidator(Jwt);

export const auth = new Elysia({ name: "auth" })
	.guard({
		// Those are not applied for now. See https://github.com/elysiajs/elysia/issues/1139
		detail: {
			security: [{ bearer: ["read"] }, { api: ["read"] }],
		},
		response: {
			401: { ...KError, description: "" },
			403: { ...KError, description: "" },
		},
	})
	.macro({
		permissions(perms: string[]) {
			return {
				resolve: async ({ headers: { authorization }, error }) => {
					const bearer = authorization?.slice(7);
					if (!bearer) return { jwt: false };
					// @ts-expect-error ts can't understand that there's two overload idk why
					const { payload } = await jwtVerify(bearer, jwtSecret ?? jwks);
					// TODO: use perms
					return { jwt: validator.Decode<typeof Jwt>(payload) };
				},
			};
		},
	})
	.as("plugin");
