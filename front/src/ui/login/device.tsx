import { useRouter } from "expo-router";
import { useEffect, useEffectEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { useMutation } from "~/data";
import type { KyooError } from "~/models";
import { Button, H1, H2, Link, P } from "~/primitives";
import { FormPage } from "./form";
import { device, useDeviceLogin } from "./logic";

const DeviceCode = z.object({
	deviceCode: z.string(),
	userCode: z.string(),
	expiresIn: z.number(),
	interval: z.number(),
});

const useDeviceCode = (apiUrl: string) => {
	const { mutate: requestCode } = useMutation(() => ({
		method: "POST",
		apiUrl,
		authToken: null,
		path: ["auth", "device"],
		params: { device },
	}));
	const [code, setCode] = useState<z.infer<typeof DeviceCode> | null>(null);
	const [error, setError] = useState<string | null>(null);

	const refresh = useEffectEvent(async () => {
		try {
			setCode(DeviceCode.parse(await requestCode()));
			setError(null);
		} catch (e) {
			setCode(null);
			setError((e as KyooError).message);
		}
	});
	useEffect(() => {
		if (!code) {
			refresh();
			return;
		}
		const timer = setTimeout(refresh, code.expiresIn * 1000 - 5000);
		return () => clearTimeout(timer);
	}, [code]);

	return { code, error, renew: () => refresh() };
};

export const DeviceLoginPage = ({ apiUrl }: { apiUrl: string }) => {
	const { t } = useTranslation();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const { code, error: codeError, renew } = useDeviceCode(apiUrl);
	const deviceLogin = useDeviceLogin();

	const poll = useEffectEvent(async () => {
		if (!code) return false;
		const ret = await deviceLogin(code.deviceCode, apiUrl);
		if (!ret.ok) {
			if (ret.error.status === 410) renew();
			else setError(ret.error.message);
			return false;
		}
		if (!ret.value) return false;
		router.replace("/");
		return true;
	});
	useEffect(() => {
		if (!code) return;
		const id = setInterval(async () => {
			if (await poll()) clearInterval(id);
		}, code.interval * 1000);
		return () => clearInterval(id);
	}, [code]);

	return (
		<FormPage apiUrl={apiUrl}>
			<H1 className="pb-4">{t("login.login")}</H1>
			<P>
				{t("login.device.instructions", {
					url: `${apiUrl}/settings`,
				})}
			</P>
			<H2 className="my-6 self-center tracking-widest">
				{code
					? `${code.userCode.slice(0, 4)}-${code.userCode.slice(4)}`
					: t("misc.loading")}
			</H2>
			{(error ?? codeError) && (
				<P className="text-red-500 dark:text-red-500">{error ?? codeError}</P>
			)}
			<Button
				text={t("login.device.or-login")}
				as={Link}
				href={`/login?apiUrl=${apiUrl}&form=true`}
				className="m-2 w-60 self-center"
			/>
		</FormPage>
	);
};
