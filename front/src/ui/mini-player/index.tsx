import CastConnected from "@material-symbols/svg-400/rounded/cast_connected-fill.svg";
import OpenInFull from "@material-symbols/svg-400/rounded/open_in_full-fill.svg";
import Pause from "@material-symbols/svg-400/rounded/pause-fill.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import { usePathname, useRouter } from "expo-router";
import {
	createContext,
	type ReactNode,
	useContext,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, View } from "react-native";
import { usePlayer, usePlayerState } from "react-native-omni";
import { useSafeAreaFrame } from "react-native-safe-area-context";
import { H6, IconButton, P, tooltip } from "~/primitives";
import { cn } from "~/utils";

// no way to read native tabs height: github.com/software-mansion/react-native-screens#3627
const TabBarHeightContext = createContext<[number, (height: number) => void]>([
	0,
	() => {},
]);

export const TabBarHeightProvider = ({ children }: { children: ReactNode }) => {
	const state = useState(0);
	return (
		<TabBarHeightContext.Provider value={state}>
			{children}
		</TabBarHeightContext.Provider>
	);
};

// `NativeTabs` insets tab-screen content above the tab bar, so the gap between
// this probe's bottom and the window bottom is the tab bar height (system
// navigation bar included).
export const MeasureTabBar = () => {
	const [, setHeight] = useContext(TabBarHeightContext);
	const frame = useSafeAreaFrame();
	const ref = useRef<View>(null);
	if (Platform.OS === "web") return null;
	return (
		<View
			ref={ref}
			onLayout={() =>
				ref.current?.measureInWindow((_x, y, _w, h) => {
					if (h) setHeight(Math.round(Math.max(0, frame.height - (y + h))));
				})
			}
			pointerEvents="none"
			collapsable={false}
			style={StyleSheet.absoluteFill}
		/>
	);
};

export const MiniPlayer = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const pathname = usePathname();
	const player = usePlayer();
	const [tabBarHeight] = useContext(TabBarHeightContext);

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
		<View
			className={cn(
				"absolute right-2 z-50 overflow-hidden rounded-lg bg-slate-900 shadow-lg",
				Platform.OS !== "web" ? "left-2" : "bottom-2 w-80 max-w-[90%]",
			)}
			style={Platform.OS !== "web" ? { bottom: tabBarHeight + 8 } : undefined}
		>
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
						{player.source?.metadata?.artist}
					</P>
				</View>
				{player.source?.src?.uri.match(/\/videos\/([^/?]+)\//)?.[1] && (
					<IconButton
						icon={OpenInFull}
						onPress={() =>
							router.push(
								`/watch/${player.source?.src?.uri.match(/\/videos\/([^/?]+)\//)?.[1]}`,
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
