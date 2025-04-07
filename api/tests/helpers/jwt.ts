import { SignJWT } from "jose";

export async function getJwtHeaders() {
	const jwt = await new SignJWT({
		sub: "39158be0-3f59-4c45-b00d-d25b3bc2b884",
		sid: "04ac7ecc-255b-481d-b0c8-537c1578e3d5",
		username: "test-username",
		permissions: ["core.read", "core.write", "users.read"],
	})
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setIssuer(process.env.JWT_ISSUER!)
		.setExpirationTime("2h")
		.sign(new TextEncoder().encode(process.env.JWT_SECRET));

	return { Authorization: `Bearer ${jwt}` };
}
