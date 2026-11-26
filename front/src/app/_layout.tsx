import { Slot, usePathname, useRouter } from "expo-router";
import { Platform } from "react-native";
import { useCastLoad } from "react-native-omni";
import { User, Video, VideoInfo } from "~/models";
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
	useCastLoad(async ({ castId, customData, startTime, source }) => {
		const slug =
			customData?.slug ?? castId.match(/\/videos\/([^/?]+)/)?.[1] ?? undefined;
		if (!slug) throw new Error(`Unknown cast: ${castId}`);
		// served by the caster with its download (in the api's format)
		const files = source.castFiles;
		const download =
			files?.video && files.info && /^https?:\/\//.test(source.src.uri)
				? await Promise.all(
						[files.video, files.info, files.user].map((x) =>
							x ? fetch(x).then((r) => r.json()) : null,
						),
					)
						.then(([video, info, user]) => ({
							slug,
							file: source.src.uri,
							video: Video.parser.parse(video),
							info: VideoInfo.parser.parse(info),
							user: user ? User.parser.parse(user) : null,
						}))
						.catch((e) => {
							console.warn("Could not fetch the cast's download", e);
							return undefined;
						})
				: undefined;
		const params = {
			slug,
			t: Math.floor(startTime ?? 0).toString(),
			caster: customData?.apiUrl
				? startCastSession(
						customData.apiUrl,
						customData.token ?? null,
						download,
					)
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
