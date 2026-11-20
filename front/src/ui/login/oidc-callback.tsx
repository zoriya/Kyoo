import { useRouter } from "expo-router";
import { useEffect, useEffectEvent } from "react";
import { useInvalidate } from "~/data";
import { P } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { useQueryState } from "~/utils";
import { useOidcLogin } from "./logic";
import { useLoginServer } from "./server-url";

export const OidcCallbackPage = () => {
	const token = useToken();
	const loginServer = useLoginServer();
	const [provider] = useQueryState("provider", undefined!);
	const [code] = useQueryState("token", undefined!);
	const [error] = useQueryState("error", undefined!);
	const [link] = useQueryState("link", undefined!);

	const apiUrl = link ? token.apiUrl : loginServer;

	const router = useRouter();
	const invalidate = useInvalidate();
	const oidcLogin = useOidcLogin();

	const run = useEffectEvent(async () => {
		if (error) {
			router.replace({ pathname: "/login", params: { error } });
			return;
		}
		const ret = await oidcLogin(
			provider,
			code,
			link ? token.authToken : null,
			apiUrl,
		);
		if (!ret.ok) {
			router.replace({
				pathname: "/login",
				params: { error: ret.error },
			});
			return;
		}
		if (link) {
			invalidate(["auth", "users", "me"]);
			router.replace("/settings");
		} else router.replace("/");
	});
	useEffect(() => {
		run();
	}, []);

	return <P>{"Loading"}</P>;
};
