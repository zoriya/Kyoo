import Devices from "@material-symbols/svg-400/outlined/devices.svg";
import Tv from "@material-symbols/svg-400/outlined/tv.svg";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import { z } from "zod/v4";
import type { KyooError } from "~/models";
import { Button, Input, P, Popup } from "~/primitives";
import { type QueryIdentifier, useFetch, useMutation } from "~/query";
import { useQueryState } from "~/utils";
import { Preference, SettingsContainer } from "./base";

export const SessionsSettings = () => {
	const { t } = useTranslation();
	const [error, setError] = useState<string | null>(null);
	const [code, setCode] = useQueryState<string | undefined>("code", undefined);
	const [deviceLoginOpen, setDeviceLoginOpen] = useState(!!code);
	const { data: sessions } = useFetch(SessionsSettings.query());
	const items = sessions ?? [];
	const { mutateAsync: revokeSession, isPending } = useMutation({
		method: "DELETE",
		compute: (id: string) => ({
			path: ["auth", "sessions", id],
		}),
		invalidate: ["auth", "users", "me", "sessions"],
	});

	return (
		<>
			<SettingsContainer
				title={t("settings.sessions.label")}
				extra={
					!Platform.isTV && (
						<Button
							icon={Tv}
							text={t("settings.sessions.device.label")}
							onPress={() => setDeviceLoginOpen(true)}
							className="mt-4"
						/>
					)
				}
			>
				{error && <P className="mx-6 text-red-500">{error}</P>}
				{items.map((session) => (
					<Preference
						key={session.id}
						icon={Devices}
						label={session.device}
						description={
							session.current
								? t("settings.sessions.current")
								: t("settings.sessions.description", {
										createdDate: session.createdDate.toLocaleString(),
										lastUsed: session.lastUsed.toLocaleString(),
									})
						}
					>
						<Button
							text={t("settings.sessions.revoke")}
							disabled={isPending}
							onPress={async () => {
								setError(null);
								try {
									await revokeSession(session.id);
								} catch (e) {
									setError((e as KyooError).message);
								}
							}}
						/>
					</Preference>
				))}
			</SettingsContainer>
			{deviceLoginOpen && (
				<DeviceLoginPopup
					initialCode={code}
					close={() => {
						setDeviceLoginOpen(false);
						if (code) setCode(undefined);
					}}
				/>
			)}
		</>
	);
};

const DeviceLoginPopup = ({
	initialCode,
	onLogged,
	close,
}: {
	initialCode?: string;
	onLogged?: (device: string | null) => void;
	close: () => void;
}) => {
	const { t } = useTranslation();
	const [code, setCode] = useState(formatCode(initialCode ?? ""));
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync: approve, isPending } = useMutation({
		method: "PATCH",
		path: ["auth", "device"],
		compute: (code: string) => ({ body: { code } }),
		parser: z.object({ device: z.string().nullable() }),
		invalidate: null,
	});

	const submit = async () => {
		setError(null);
		const ret = await approve(code).catch((e: KyooError) => {
			setError(
				e.status === 404 ? t("settings.sessions.device.invalid") : e.message,
			);
			return null;
		});
		if (!ret) return;
		onLogged?.(ret.device);
		close();
	};

	return (
		<Popup title={t("settings.sessions.device.label")} icon={Tv} close={close}>
			<P>{t("settings.sessions.device.description")}</P>
			<Input
				value={code}
				onChangeText={(v) => setCode(formatCode(v))}
				onSubmitEditing={submit}
				placeholder="XXXX-XXXX"
				maxLength={9}
				autoCapitalize="characters"
				autoCorrect={false}
				autoFocus
				containerClassName="my-1"
			/>
			{error && <P className="text-red-500">{error}</P>}
			<View className="my-1 flex-row gap-2 self-end">
				<Button
					text={t("misc.cancel")}
					onPress={() => close()}
					className="min-w-24"
				/>
				<Button
					text={t("settings.sessions.device.login")}
					disabled={isPending || code.length !== 9}
					onPress={submit}
					className="min-w-24"
				/>
			</View>
		</Popup>
	);
};

const formatCode = (code: string) => {
	const letters = code
		.toUpperCase()
		.replace(/[^A-Z]/g, "")
		.slice(0, 8);
	return letters.length > 4
		? `${letters.slice(0, 4)}-${letters.slice(4)}`
		: letters;
};

SessionsSettings.query = (): QueryIdentifier<Session[]> => ({
	path: ["auth", "users", "me", "sessions"],
	parser: z.array(Session),
});

const Session = z.object({
	id: z.string(),
	createdDate: z.coerce.date(),
	lastUsed: z.coerce.date(),
	device: z.string(),
	current: z.boolean(),
});
type Session = z.infer<typeof Session>;
