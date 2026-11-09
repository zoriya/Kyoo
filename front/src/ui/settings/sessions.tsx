import { EntityMixin, Invalidate, schema } from "@data-client/rest";
import Devices from "@material-symbols/svg-400/outlined/devices.svg";
import Tv from "@material-symbols/svg-400/outlined/tv.svg";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import { z } from "zod/v4";
import { Fetch, type QueryIdentifier, useMutation } from "~/data";
import type { KyooError } from "~/models";
import { typed } from "~/models/utils/utils";
import { Button, Input, P, Popup, Skeleton } from "~/primitives";
import { useQueryState } from "~/utils";
import { Preference, SettingsContainer } from "./base";

const session = z.object({
	id: z.string(),
	createdDate: z.coerce.date(),
	lastUsed: z.coerce.date(),
	device: z.string(),
	current: z.boolean(),
});
class Session extends EntityMixin(typed<z.infer<typeof session>>(class {}), {
	key: "Session",
}) {
	static parser = session.pipe(z.custom<Session>());
}
// the api answers a bare array, not a page
const Sessions = Object.assign(new schema.Array(Session), {
	parser: z.array(Session.parser),
});

const Device = z.object({ device: z.string().nullable() });

export const SessionsSettings = () => {
	const { t } = useTranslation();
	const [error, setError] = useState<string | null>(null);
	const [code, setCode] = useQueryState<string | undefined>("code", undefined);
	const [deviceLoginOpen, setDeviceLoginOpen] = useState(!!code);
	const { mutate: revokeSession, isPending } = useMutation((id: string) => ({
		method: "DELETE",
		path: ["auth", "sessions", id],
		optimisticSchema: new Invalidate(Session),
		optimistic: () => ({ id }),
	}));

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
				<Fetch
					query={SessionsSettings.query()}
					Loader={() => (
						<Preference
							icon={Devices}
							label={<Skeleton className="w-24" />}
							description={<Skeleton className="h-4 w-28" />}
						/>
					)}
					Render={(sessions) => (
						<>
							{sessions.map((session) => (
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
						</>
					)}
				/>
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
	const { mutate: approve, isPending } = useMutation((code: string) => ({
		method: "PATCH",
		path: ["auth", "device"],
		body: { code },
	}));

	const submit = async () => {
		setError(null);
		const ret = await approve(code).catch((e: KyooError) => {
			setError(
				e.status === 404 ? t("settings.sessions.device.invalid") : e.message,
			);
			return null;
		});
		if (!ret) return;
		onLogged?.(Device.parse(ret).device);
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
	schema: Sessions,
});
