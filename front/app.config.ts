import type { ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";

// Defined outside the config because dark splashscreen needs to be platform specific.
const splash = {
	image: "./public/icon-256x256.png",
	resizeMode: "contain",
	backgroundColor: "#eff1f5",
	dark: {
		image: "./public/icon-256x256.png",
		resizeMode: "contain",
		backgroundColor: "#1e1e2e",
	},
} as const;

export const expo: ExpoConfig = {
	name: IS_DEV ? "Kyoo Development" : "Kyoo",
	slug: "kyoo",
	scheme: "kyoo",
	version: "1.0.0",
	sdkVersion: "52.0.0",
	newArchEnabled: true,
	platforms: ["ios", "android"],
	orientation: "default",
	icon: "./public/icon-256x256.png",
	userInterfaceStyle: "automatic",
	splash,
	assetBundlePatterns: ["**/*"],
	ios: {
		supportsTablet: true,
	},
	android: {
		package: IS_DEV ? "dev.zoriya.kyoo.dev" : "dev.zoriya.kyoo",
		adaptiveIcon: {
			foregroundImage: "./public/icon-256x256.png",
			backgroundColor: "#eff1f5",
		},
		splash,
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
		"vxrn/expo-plugin",
		[
			"expo-build-properties",
			{
				android: {
					usesCleartextTraffic: true,
				},
			},
		],
		"expo-localization",
		// [
		// 	"react-native-video",
		// 	{
		// 		enableNotificationControls: true,
		// 	},
		// ],
	],
};
