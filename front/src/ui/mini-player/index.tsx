import CastConnected from "@material-symbols/svg-400/rounded/cast_connected-fill.svg";
import OpenInFull from "@material-symbols/svg-400/rounded/open_in_full-fill.svg";
import Pause from "@material-symbols/svg-400/rounded/pause-fill.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import { usePathname, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { usePlayer, usePlayerState } from "react-native-omni";
import { H6, IconButton, P, tooltip } from "~/primitives";

export const MiniPlayer = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const pathname = usePathname();
	const player = usePlayer();

	const castStatus = usePlayerState("castStatus");
	const playing = usePlayerState("isPlaying");
	const current = usePlayerState("currentTime");
	const duration = usePlayerState("duration");

	if (
		!(castStatus === "connected" || castStatus === "connecting") ||
		pathname.startsWith("/watch")
	)
		return null;

	return (
		<View className="absolute right-2 bottom-2 z-50 w-80 max-w-[90%] overflow-hidden rounded-lg bg-slate-900 shadow-lg">
			<View className="h-0.5 w-full bg-slate-700">
				<View
					className="h-full bg-accent"
					style={{
						width: `${Math.min(100, Math.max(0, (current / duration) * 100))}%`,
					}}
				/>
			</View>
			<View className="flex-row items-center gap-1 p-1">
				<IconButton
					icon={playing ? Pause : PlayArrow}
					onPress={() => (playing ? player.pause() : player.play())}
					iconClassName={"fill-slate-200"}
					{...tooltip(playing ? t("player.pause") : t("player.play"))}
				/>
				<View className="min-w-0 flex-1">
					<H6 numberOfLines={1} className="text-slate-200">
						{player.source?.metadata?.title}
					</H6>
					<P numberOfLines={1} className="text-slate-400 text-xs">
						{t("miniPlayer.casting")}
					</P>
				</View>
				{player.source?.src[0]?.uri.match(/\/videos\/([^/?]+)\//)?.[1] && (
					<IconButton
						icon={OpenInFull}
						onPress={() =>
							router.push(
								`/watch/${player.source?.src[0]?.uri.match(/\/videos\/([^/?]+)\//)?.[1]}`,
							)
						}
						iconClassName={"fill-slate-200"}
						{...tooltip(t("miniPlayer.open"))}
					/>
				)}
				<IconButton
					icon={CastConnected}
					onPress={player.toggleCastStatus}
					iconClassName={"fill-slate-200"}
					{...tooltip(t("miniPlayer.stop"))}
				/>
			</View>
		</View>
	);
};
