import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import { type Theme, useYoshiki } from "yoshiki/native";
import { Button, H1, Input, Link, P, ts } from "~/primitives";
import { type QueryIdentifier, useFetch } from "~/query";

export const cleanApiUrl = (apiUrl: string) => {
	if (Platform.OS === "web") return undefined;
	if (!/https?:\/\//.test(apiUrl)) apiUrl = `http://${apiUrl}`;
	return apiUrl.replace(/\/$/, "");
};

export const ServerUrlPage = () => {
	const [_apiUrl, setApiUrl] = useState("");
	const apiUrl = cleanApiUrl(_apiUrl);
	const { data, error } = useFetch({
		...ServerUrlPage.query,
		options: { apiUrl, authToken: null },
	});
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<View
			{...css({
				marginX: ts(3),
				justifyContent: "space-between",
				flexGrow: 1,
			})}
		>
			<H1>{t("login.server")}</H1>
			<View {...css({ justifyContent: "center" })}>
				<Input
					variant="big"
					onChangeText={setApiUrl}
					autoCorrect={false}
					autoCapitalize="none"
				/>
				{!data && (
					<P
						{...css({
							color: (theme: Theme) => theme.colors.red,
							alignSelf: "center",
						})}
					>
						{error?.message ?? t("misc.loading")}
					</P>
				)}
			</View>
			<View {...css({ marginTop: ts(5) })}>
				{/* <View {...css({ flexDirection: "row", width: percent(100), alignItems: "center" })}> */}
				{/* 	{data && */}
				{/* 		Object.values(data.oidc).map((x) => ( */}
				{/* 			<Link */}
				{/* 				key={x.displayName} */}
				{/* 				href={{ pathname: x.link, query: { apiUrl } }} */}
				{/* 				{...css({ justifyContent: "center" })} */}
				{/* 			> */}
				{/* 				{x.logoUrl != null ? ( */}
				{/* 					<ImageBackground */}
				{/* 						source={{ uri: x.logoUrl }} */}
				{/* 						{...css({ width: ts(3), height: ts(3), margin: ts(1) })} */}
				{/* 					/> */}
				{/* 				) : ( */}
				{/* 					t("login.via", { provider: x.displayName }) */}
				{/* 				)} */}
				{/* 			</Link> */}
				{/* 		))} */}
				{/* </View> */}
				{/* <HR /> */}
				<View {...css({ flexDirection: "row", gap: ts(2) })}>
					<Button
						text={t("login.login")}
						as={Link}
						href={`/login?apiUrl=${apiUrl}`}
						disabled={data == null}
						{...css({ flexGrow: 1, flexShrink: 1 })}
					/>
					<Button
						text={t("login.register")}
						as={Link}
						href={`/register?apiUrl=${apiUrl}`}
						disabled={data == null}
						{...css({ flexGrow: 1, flexShrink: 1 })}
					/>
				</View>
			</View>
			<View />
		</View>
	);
};

ServerUrlPage.query = {
	path: ["api", "health"],
	parser: null,
} satisfies QueryIdentifier;
