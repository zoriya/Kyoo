import { EntityMixin } from "@data-client/rest";
import { Platform } from "react-native";
import z from "zod/v4";
import { typed } from "./utils/utils";

const authInfo = z
	.object({
		publicUrl: z.string(),
		allowRegister: z.boolean().optional().default(true),
		oidc: z.record(
			z.string(),
			z.object({
				name: z.string(),
				logo: z.string().nullable().optional(),
			}),
		),
	})
	.transform((x) => {
		const redirect = `${Platform.OS === "web" ? x.publicUrl : "kyoo://"}/oidc-callback?apiUrl=${x.publicUrl}`;
		return {
			...x,
			oidc: Object.fromEntries(
				Object.entries(x.oidc).map(([provider, info]) => [
					provider,
					{
						...info,
						connect: `${x.publicUrl}/auth/oidc/login/${provider}?redirectUrl=${encodeURIComponent(redirect)}`,
						link: `${x.publicUrl}/auth/oidc/login/${provider}?redirectUrl=${encodeURIComponent(`${redirect}&link=true`)}`,
					},
				]),
			),
		};
	});

export class AuthInfo extends EntityMixin(
	typed<z.infer<typeof authInfo>>(class {}),
	{ key: "AuthInfo", pk: "publicUrl" },
) {
	static parser = authInfo.pipe(z.custom<AuthInfo>());
}
