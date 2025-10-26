import type { ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";

export const expo: ExpoConfig = {
	name: IS_DEV ? "Kyoo Development" : "Kyoo",
	slug: "kyoo",
	scheme: "kyoo",
	version: "1.0.0",
	newArchEnabled: true,
	platforms: ["web", "ios", "android"],
	orientation: "default",
	icon: "./public/icon-256x256.png",
	userInterfaceStyle: "automatic",
	ios: {
		supportsTablet: true,
	},
	android: {
		package: IS_DEV ? "dev.zoriya.kyoo.dev" : "dev.zoriya.kyoo",
		adaptiveIcon: {
			foregroundImage: "./public/icon-256x256.png",
			backgroundColor: "#eff1f5",
		},
		edgeToEdgeEnabled: true,
	},
	web: {
		favicon: "./public/icon-256x256.png",
		output: "single",
		bundler: "metro",
	},
	updates: {
		url: "https://u.expo.dev/55de6b52-c649-4a15-9a45-569ff5ed036c",
		fallbackToCacheTimeout: 0,
	},
	runtimeVersion: {
		policy: "sdkVersion",
	},
	extra: {
		eas: {
			projectId: "55de6b52-c649-4a15-9a45-569ff5ed036c",
		},
	},
	plugins: [
		"expo-router",
		[
			"expo-build-properties",
			{
				android: {
					usesCleartextTraffic: true,
				},
			},
		],
		"expo-localization",
		[
			"expo-splash-screen",
			{
				image: "./public/icon-256x256.png",
				resizeMode: "contain",
				backgroundColor: "#eff1f5",
				dark: {
					image: "./public/icon-256x256.png",
					resizeMode: "contain",
					backgroundColor: "#1e1e2e",
				},
			},
		],
		[
			"react-native-video",
			{
				enableAndroidPictureInPicture: true,
				enableBackgroundAudio: true,
				androidExtensions: {
					useExoplayerDash: true,
					useExoplayerHls: true,
				},
			},
		],
	],
	experiments: {
		typedRoutes: true,
	},
};
