import { Slot, usePathname, useRouter } from "expo-router";
import { Platform } from "react-native";
import { useCastLoad } from "react-native-omni";
import { Providers } from "~/providers";
import { startCastSession } from "~/ui/player/cast-session";
import "../global.css";
import { Tooltip, useMobileHover } from "~/primitives";
import "~/fonts.web.css";

export const unstable_settings = {
	anchor: "(app)",
};

const CastReceiver = () => {
	const router = useRouter();
	const pathname = usePathname();
	useCastLoad(({ castId, customData, startTime }) => {
		const slug =
			customData?.slug ?? castId.match(/\/videos\/([^/?]+)/)?.[1] ?? undefined;
		if (!slug) throw new Error(`Unknown cast: ${castId}`);
		const params = {
			slug,
			t: Math.floor(startTime ?? 0).toString(),
			caster: customData?.apiUrl
				? startCastSession(customData.apiUrl, customData.token ?? null)
				: undefined,
		};
		if (pathname.startsWith("/watch/")) router.setParams(params);
		else router.navigate({ pathname: "/watch/[slug]", params });
	});
	return null;
};

export default function Layout() {
	useMobileHover();

	return (
		<Providers>
			<Slot />
			{Platform.isTV && <CastReceiver />}
			{Platform.OS === "web" && <Tooltip />}
		</Providers>
	);
}
