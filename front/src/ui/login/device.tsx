import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { z } from "zod/v4";
import { Button, capitalize, H1, H2, Link, P } from "~/primitives";
import { queryFn } from "~/query";
import { FormPage } from "./form";
import { deviceLogin } from "./logic";

const DeviceCode = z.object({
	deviceCode: z.string(),
	userCode: z.string(),
	expiresIn: z.number(),
	interval: z.number(),
});

export const DeviceLoginPage = ({ apiUrl }: { apiUrl: string }) => {
	const { t } = useTranslation();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const device = `${capitalize(Platform.OS)} TV App`;

	const { data, refetch } = useQuery({
		queryKey: [apiUrl, "auth", "device"],
		queryFn: (ctx) =>
			queryFn({
				method: "POST",
				url: `${apiUrl}/auth/device?device=${encodeURIComponent(device)}`,
				authToken: null,
				signal: ctx.signal,
				parser: DeviceCode,
			}),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: 0,
		// codes expire, request a new one before that happens
		refetchInterval: (query) =>
			query.state.data ? query.state.data.expiresIn * 1000 : false,
	});

	useEffect(() => {
		if (!data) return;
		const id = setInterval(async () => {
			const ret = await deviceLogin(data.deviceCode, device, apiUrl);
			if (!ret.ok) {
				if (ret.error.status === 410) refetch();
				else setError(ret.error.message);
				return;
			}
			if (!ret.value) return;
			clearInterval(id);
			router.replace("/");
		}, data.interval * 1000);
		return () => clearInterval(id);
	}, [data, device, apiUrl, refetch, router]);

	return (
		<FormPage apiUrl={apiUrl}>
			<H1 className="pb-4">{t("login.login")}</H1>
			<P>
				{t("login.device.instructions", {
					url: `${apiUrl}/settings`,
				})}
			</P>
			<H2 className="my-6 self-center tracking-widest">
				{data
					? `${data.userCode.slice(0, 4)}-${data.userCode.slice(4)}`
					: t("misc.loading")}
			</H2>
			{error && <P className="text-red-500 dark:text-red-500">{error}</P>}
			<Button
				text={t("login.device.or-login")}
				as={Link}
				href={`/login?apiUrl=${apiUrl}&form=true`}
				className="m-2 w-60 self-center"
			/>
		</FormPage>
	);
};
