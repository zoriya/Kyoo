import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Slot, useRouter } from "expo-router";
import { Platform } from "react-native";
import { useCastLoad } from "react-native-omni";
import { Providers } from "~/providers";
import { startCastSession } from "~/ui/player/cast-session";
import "../global.css";
import { Tooltip, useMobileHover } from "~/primitives";
import "~/fonts.web.css";

export const unstable_settings = {
	initialRouteName: "(app)",
};

const CastReceiver = () => {
	const router = useRouter();
	useCastLoad(({ castId, customData, startTime }) => {
		const slug =
			customData?.slug ?? castId.match(/\/videos\/([^/?]+)/)?.[1] ?? undefined;
		if (!slug) throw new Error(`Unknown cast: ${castId}`);
		router.navigate({
			pathname: "/watch/[slug]",
			params: {
				slug,
				...(startTime !== undefined && { t: Math.floor(startTime).toString() }),
				...(customData?.apiUrl && {
					caster: startCastSession(customData.apiUrl, customData.token ?? null),
				}),
			},
		});
	});
	return null;
};

export default function Layout() {
	useMobileHover();

	return (
		<Providers>
			<Slot />
			{Platform.isTV && <CastReceiver />}
			{Platform.OS === "web" && (
				<>
					<ReactQueryDevtools initialIsOpen={false} />
					<Tooltip />
				</>
			)}
		</Providers>
	);
}
