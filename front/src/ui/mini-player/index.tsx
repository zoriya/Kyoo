import CastConnected from "@material-symbols/svg-400/rounded/cast_connected-fill.svg";
import OpenInFull from "@material-symbols/svg-400/rounded/open_in_full-fill.svg";
import Pause from "@material-symbols/svg-400/rounded/pause-fill.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import { usePathname, useRouter, useSegments } from "expo-router";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, View } from "react-native";
import { type Source, usePlayer, usePlayerState } from "react-native-omni";
import {
	useSafeAreaFrame,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Portal } from "react-native-teleport";
import { H6, IconButton, P, tooltip } from "~/primitives";
import { setPlayerSource } from "~/ui/player/imperative";
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
	const pathname = usePathname();
	const player = usePlayer();
	const castStatus = usePlayerState("castStatus");
	const source = usePlayerState("source");

	const casting = castStatus === "connected" || castStatus === "connecting";
	const onWatch = pathname.startsWith("/watch");

	// ending a cast hands the playback back to the local player. outside of the
	// watch screen that means playing with no ui at all, drop the media instead.
	useEffect(() => {
		if (Platform.OS === "web") return;
		if (!casting && !onWatch && source) setPlayerSource(player, undefined);
	}, [casting, onWatch, source, player]);

	if (!casting || !source || onWatch) return null;

	return <MiniPlayerInner source={source} />;
};

const MiniPlayerInner = ({ source }: { source: Source }) => {
	const { t } = useTranslation();
	const router = useRouter();
	const player = usePlayer();
	const segments = useSegments();
	const insets = useSafeAreaInsets();
	const [tabBarHeight] = useContext(TabBarHeightContext);

	const playing = usePlayerState("isPlaying");
	const current = usePlayerState("currentTime");
	const duration = usePlayerState("duration");

	const videoId = source.src?.uri.match(/\/videos\/([^/?]+)\//)?.[1];

	const inTabs = segments.includes("(tabs)");
	const bottom = (inTabs ? tabBarHeight : insets.bottom) + 8;

	return (
		<Portal hostName="root">
			<View
				className={cn(
					"absolute right-2 overflow-hidden rounded-lg bg-slate-900 shadow-lg",
					Platform.OS !== "web" ? "left-2" : "bottom-2 w-80 max-w-[90%]",
				)}
				style={Platform.OS !== "web" ? { bottom, elevation: 0 } : undefined}
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
							{source.metadata?.title}
						</H6>
						<P numberOfLines={1} className="text-slate-400 text-xs">
							{source.metadata?.artist}
						</P>
					</View>
					{videoId && (
						<IconButton
							icon={OpenInFull}
							onPress={() => router.push(`/watch/${videoId}`)}
							iconClassName={"fill-slate-200"}
							{...tooltip(t("miniPlayer.open"))}
						/>
					)}
					{Platform.OS === "web" && (
						<IconButton
							icon={CastConnected}
							onPress={() =>
								videoId
									? router.push(`/watch/${videoId}?stopCast=true`)
									: player.toggleCastStatus()
							}
							iconClassName={"fill-slate-200"}
							{...tooltip(t("miniPlayer.stop"))}
						/>
					)}
				</View>
			</View>
		</Portal>
	);
};
