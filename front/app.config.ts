import "tsx/cjs";
import type { ExpoConfig } from "expo/config";
import { supportedLanguages } from "./src/providers/translations.compile.ts";

const IS_DEV = process.env.APP_VARIANT === "development";

export const expo: ExpoConfig = {
	name: IS_DEV ? "Kyoo Development" : "Kyoo",
	slug: "kyoo",
	scheme: "kyoo",
	version: "1.0.0",
	newArchEnabled: true,
	platforms: ["web", "ios", "android"],
	orientation: "default",
	icon: "./public/favicon-96x96-dark.png",
	userInterfaceStyle: "automatic",
	ios: {
		supportsTablet: true,
	},
	android: {
		package: IS_DEV ? "dev.zoriya.kyoo.dev" : "dev.zoriya.kyoo",
		adaptiveIcon: {
			foregroundImage: "./public/android-adaptive-icon.png",
			backgroundColor: "#6b00b8",
		},
		edgeToEdgeEnabled: true,
	},
	web: {
		bundler: "metro",
		favicon: "./public/icon.svg",
		output: "single",
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
				image: "./public/splash-screen.png",
				resizeMode: "contain",
				backgroundColor: "#6b00b8",
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
		[
			"react-native-localization-settings",
			{
				languages: supportedLanguages,
			},
		],
		[
			"expo-font",
			{
				android: {
					fonts: [
						{
							fontFamily: "Poppins",
							fontDefinitions: [
								{
									fontFamily: "Poppins",
									fontStyle: "normal",
									fontWeight: "300",
									file: "./node_modules/@expo-google-fonts/poppins/300Light/Poppins_300Light.ttf",
								},
								{
									fontFamily: "Poppins",
									fontStyle: "normal",
									fontWeight: "500",
									file: "./node_modules/@expo-google-fonts/poppins/500Medium/Poppins_500Medium.ttf",
								},
								{
									fontFamily: "Sora",
									fontStyle: "normal",
									fontWeight: "800",
									file: "./node_modules/@expo-google-fonts/sora/800ExtraBold/Sora_800ExtraBold.ttf",
								},
							],
						},
					],
				},
			},
		],
	],
	experiments: {
		typedRoutes: true,
	},
};
