import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import { AuthInfo } from "~/models/auth-info";
import { Button, HRP, Link, Skeleton } from "~/primitives";
import { Fetch, type QueryIdentifier } from "~/query";

export const OidcLogin = ({ apiUrl }: { apiUrl: string }) => {
	const { t } = useTranslation();

	return (
		<Fetch
			query={OidcLogin.query(apiUrl)}
			Render={(info) => (
				<>
					<View className="my-2 items-center">
						{Object.entries(info.oidc).map(([id, provider], index) => (
							<Button
								as={Link}
								key={id}
								href={provider.connect}
								replace
								className="w-full sm:w-3/4"
								hasTVPreferredFocus={index === 0}
								left={
									provider.logo ? (
										<Image
											source={{ uri: provider.logo }}
											className="mx-2 h-6 w-6"
											resizeMode="contain"
										/>
									) : null
								}
								text={t("login.via", { provider: provider.name })}
							/>
						))}
					</View>
					{Object.keys(info.oidc).length > 0 && <HRP text={t("misc.or")} />}
				</>
			)}
			Loader={() => (
				<>
					<View className="my-2 items-center">
						{[...Array(3)].map((_, i) => (
							<Button key={i} className="w-full sm:w-3/4">
								<Skeleton />
							</Button>
						))}
					</View>
					<HRP text={t("misc.or")} />
				</>
			)}
		/>
	);
};

OidcLogin.query = (apiUrl?: string): QueryIdentifier<AuthInfo> => ({
	path: ["auth", "info"],
	parser: AuthInfo,
	options: { apiUrl, returnError: true },
});
