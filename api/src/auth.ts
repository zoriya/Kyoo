import { TypeCompiler } from "@sinclair/typebox/compiler";
import Elysia, { t } from "elysia";
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
	sid: t.String({ description: "Session id" }),
	username: t.String(),
	permissions: t.Array(t.String()),
});
const validator = TypeCompiler.Compile(Jwt);

export const auth = new Elysia({ name: "auth" })
	.guard({
		headers: t.Object({
			authorization: t.TemplateLiteral("Bearer ${string}"),
		}),
	})
	.resolve(async ({ headers: { authorization }, error }) => {
		const bearer = authorization?.slice(7);
		if (!bearer) {
			return error(500, {
				status: 500,
				message: "No jwt, auth server configuration error.",
			});
		}

		try {
			// @ts-expect-error ts can't understand that there's two overload idk why
			const { payload } = await jwtVerify(bearer, jwtSecret ?? jwks, {
				issuer: process.env.JWT_ISSUER,
			});
			const jwt = validator.Decode(payload);

			return { jwt };
		} catch (err) {
			return error(403, {
				status: 403,
				message: "Invalid jwt. Verification vailed",
				details: err,
			});
		}
	})
	.macro({
		permissions(perms: string[]) {
			return {
				beforeHandle: ({ jwt, error }) => {
					for (const perm of perms) {
						if (!jwt!.permissions.includes(perm)) {
							return error(403, {
								status: 403,
								message: `Missing permission: '${perm}'.`,
								details: { current: jwt!.permissions, required: perms },
							});
						}
					}
				},
			};
		},
	})
	.as("plugin");

const User = t.Object({
	id: t.String({ format: "uuid" }),
	username: t.String(),
	email: t.String({ format: "email" }),
	createdDate: t.String({ format: "date-time" }),
	lastSeen: t.String({ format: "date-time" }),
	claims: t.Record(t.String(), t.Any()),
	oidc: t.Record(
		t.String(),
		t.Object({
			id: t.String({ format: "uuid" }),
			username: t.String(),
			profileUrl: t.Nullable(t.String({ format: "url" })),
		}),
	),
});
const UserC = TypeCompiler.Compile(t.Union([User, KError]));

export async function getUserInfo(
	id: string,
	headers: { authorization: string },
) {
	const resp = await fetch(
		new URL(`/auth/users/${id}`, process.env.AUTH_SERVER ?? "http://auth:4568"),
		{ headers },
	);

	return UserC.Decode(await resp.json());
}
