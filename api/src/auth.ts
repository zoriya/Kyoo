import { TypeCompiler } from "@sinclair/typebox/compiler";
import { Value } from "@sinclair/typebox/value";
import Elysia, { t } from "elysia";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { UserC } from "~/models/user";
import type { Prettify } from "./utils";

const jwtSecret = process.env.JWT_SECRET
	? new TextEncoder().encode(process.env.JWT_SECRET)
	: null;
const jwks = createRemoteJWKSet(
	new URL(
		".well-known/jwks.json",
		process.env.AUTH_SERVER ?? "http://auth:4568",
	),
);

const Settings = t.Object(
	{
		preferOriginal: t.Boolean({ default: true }),
	},
	{ additionalProperties: true },
);
type Settings = typeof Settings.static;

const Jwt = t.Object({
	sub: t.String({ description: "User id" }),
	sid: t.String({ description: "Session id" }),
	username: t.String(),
	permissions: t.Array(t.String()),
	settings: t.Optional(t.Partial(Settings, { default: {} })),
	wsRoutes: t.Optional(t.Array(t.String())),
});
type Jwt = typeof Jwt.static;
const validator = TypeCompiler.Compile(Jwt);

export async function verifyJwt(bearer: string) {
	// @ts-expect-error ts can't understand that there's two overload idk why
	const { payload } = await jwtVerify(bearer, jwtSecret ?? jwks, {
		issuer: process.env.JWT_ISSUER,
	});
	const raw = validator.Decode(payload);
	const jwt = Value.Default(Jwt, raw) as Prettify<Jwt & { settings: Settings }>;

	return { jwt };
}

export const auth = new Elysia({ name: "auth" })
	.guard({
		schema: "standalone",
		headers: t.Object(
			{
				authorization: t.Optional(t.TemplateLiteral("Bearer ${string}")),
			},
			{ additionalProperties: true },
		),
	})
	.resolve(async ({ headers: { authorization }, status }) => {
		const bearer = authorization?.slice(7);
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
	})
	.macro({
		permissions(perms: string[]) {
			return {
				beforeHandle: function permissionCheck({ jwt, status }) {
					for (const perm of perms) {
						if (!jwt!.permissions.includes(perm)) {
							return status(403, {
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
	.as("scoped");

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
