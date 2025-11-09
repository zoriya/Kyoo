// import {
// 	type QueryIdentifier,
// 	type ServerInfo,
// 	ServerInfoP,
// 	queryFn,
// 	useAccount,
// 	useFetch,
// } from "@kyoo/models";
// import { Button, IconButton, Link, Skeleton, tooltip, ts } from "@kyoo/primitives";
// import { useTranslation } from "react-i18next";
// import { ImageBackground } from "react-native";
// import { rem, useYoshiki } from "yoshiki/native";
// import { ErrorView } from "../errors";
// import { Preference, SettingsContainer } from "./base";
//
// import Badge from "@material-symbols/svg-400/outlined/badge.svg";
// import Remove from "@material-symbols/svg-400/outlined/close.svg";
// import OpenProfile from "@material-symbols/svg-400/outlined/open_in_new.svg";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
//
// export const OidcSettings = () => {
// 	const account = useAccount()!;
// 	const { css } = useYoshiki();
// 	const { t } = useTranslation();
// 	const { data, error } = useFetch(OidcSettings.query());
// 	const queryClient = useQueryClient();
// 	const { mutateAsync: unlinkAccount } = useMutation({
// 		mutationFn: async (provider: string) =>
// 			await queryFn({
// 				path: ["auth", "login", provider],
// 				method: "DELETE",
// 			}),
// 		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
// 	});
//
// 	return (
// 		<SettingsContainer title={t("settings.oidc.label")}>
// 			{error ? (
// 				<ErrorView error={error} />
// 			) : data ? (
// 				Object.entries(data.oidc).map(([id, x]) => {
// 					const acc = account.externalId[id];
// 					return (
// 						<Preference
// 							key={x.displayName}
// 							icon={Badge}
// 							label={x.displayName}
// 							description={
// 								acc
// 									? t("settings.oidc.connected", { username: acc.username })
// 									: t("settings.oidc.not-connected")
// 							}
// 							customIcon={
// 								x.logoUrl != null && (
// 									<ImageBackground
// 										source={{ uri: x.logoUrl }}
// 										{...css({ width: ts(3), height: ts(3), marginRight: ts(2) })}
// 									/>
// 								)
// 							}
// 						>
// 							{acc ? (
// 								<>
// 									{acc.profileUrl && (
// 										<IconButton
// 											icon={OpenProfile}
// 											as={Link}
// 											href={acc.profileUrl}
// 											target="_blank"
// 											{...tooltip(t("settings.oidc.open-profile", { provider: x.displayName }))}
// 										/>
// 									)}
// 									<IconButton
// 										icon={Remove}
// 										onPress={() => unlinkAccount(id)}
// 										{...tooltip(t("settings.oidc.delete", { provider: x.displayName }))}
// 									/>
// 								</>
// 							) : (
// 								<Button
// 									text={t("settings.oidc.link")}
// 									as={Link}
// 									href={x.link}
// 									{...css({ minWidth: rem(6) })}
// 								/>
// 							)}
// 						</Preference>
// 					);
// 				})
// 			) : (
// 				[...Array(3)].map((_, i) => (
// 					<Preference
// 						key={i}
// 						customIcon={<Skeleton {...css({ width: ts(3), height: ts(3) })} />}
// 						icon={null!}
// 						label={<Skeleton {...css({ width: rem(6) })} />}
// 						description={<Skeleton {...css({ width: rem(7), height: rem(0.8) })} />}
// 					/>
// 				))
// 			)}
// 		</SettingsContainer>
// 	);
// };
//
// OidcSettings.query = (): QueryIdentifier<ServerInfo> => ({
// 	path: ["info"],
// 	parser: ServerInfoP,
// });
