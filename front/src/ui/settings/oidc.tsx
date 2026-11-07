import Badge from "@material-symbols/svg-400/outlined/badge.svg";
import Remove from "@material-symbols/svg-400/outlined/close.svg";
import OpenProfile from "@material-symbols/svg-400/outlined/open_in_new.svg";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image } from "react-native";
import { Fetch, type QueryIdentifier, useMutation } from "~/data";
import { type KyooError, User } from "~/models";
import { AuthInfo } from "~/models/auth-info";
import { Button, IconButton, Link, P, Skeleton, tooltip } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { Preference, SettingsContainer } from "./base";

export const OidcSettings = () => {
	const { t } = useTranslation();
	const account = useAccount()!;
	const [unlinkError, setUnlinkError] = useState<string | null>(null);
	const { mutate: unlinkAccount } = useMutation((provider: string) => ({
		method: "DELETE",
		path: ["auth", "oidc", "login", provider],
		optimisticSchema: User,
		optimistic: () => ({
			id: account.id,
			oidc: Object.fromEntries(
				Object.entries(account.oidc).filter(([id]) => id !== provider),
			),
		}),
	}));

	return (
		<Fetch
			query={OidcSettings.authQuery()}
			Loader={OidcSettings.Loader}
			Render={(info) =>
				Object.keys(info.oidc).length === 0 ? null : (
					<SettingsContainer title={t("settings.oidc.label")}>
						{unlinkError && <P className="text-red-500">{unlinkError}</P>}
						{Object.entries(info.oidc).map(([id, x]) => {
							const acc = account.oidc[id];
							return (
								<Preference
									key={id}
									icon={Badge}
									label={x.name}
									description={
										acc
											? t("settings.oidc.connected", { username: acc.username })
											: t("settings.oidc.not-connected")
									}
									customIcon={
										x.logo != null && (
											<Image
												source={{ uri: x.logo }}
												className="mr-4 h-6 w-6"
												resizeMode="contain"
											/>
										)
									}
								>
									{acc ? (
										<>
											{acc.profileUrl && (
												<IconButton
													icon={OpenProfile}
													as={Link}
													href={acc.profileUrl}
													{...tooltip(
														t("settings.oidc.open-profile", {
															provider: x.name,
														}),
													)}
												/>
											)}
											<IconButton
												icon={Remove}
												onPress={async () => {
													setUnlinkError(null);
													try {
														await unlinkAccount(id);
													} catch (e) {
														setUnlinkError((e as KyooError).message);
													}
												}}
												{...tooltip(
													t("settings.oidc.delete", { provider: x.name }),
												)}
											/>
										</>
									) : (
										<Button
											text={t("settings.oidc.link")}
											as={Link}
											href={x.link}
											replace
										/>
									)}
								</Preference>
							);
						})}
					</SettingsContainer>
				)
			}
		/>
	);
};

OidcSettings.Loader = () => {
	const { t } = useTranslation();

	return (
		<SettingsContainer title={t("settings.oidc.label")}>
			{[...Array(3)].map((_, i) => (
				<Preference
					key={i}
					customIcon={<Skeleton className="h-6 w-6" />}
					icon={null!}
					label={<Skeleton className="w-24" />}
					description={<Skeleton className="h-4 w-28" />}
				/>
			))}
		</SettingsContainer>
	);
};

OidcSettings.authQuery = (): QueryIdentifier<AuthInfo> => ({
	path: ["auth", "info"],
	schema: AuthInfo,
});
