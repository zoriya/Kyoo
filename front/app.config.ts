import "tsx/cjs";
import type { ExpoConfig } from "expo/config";
import { supportedLanguages } from "./src/providers/translations.compile.ts";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_TV = process.env.EXPO_TV === "1";
const updateUrl = "https://u.expo.dev/55de6b52-c649-4a15-9a45-569ff5ed036c";

export const expo: ExpoConfig = {
	name: IS_DEV ? "Kyoo Dev" : "Kyoo",
	slug: "kyoo",
	scheme: "kyoo",
	version: process.env.APP_VERSION || "1.0.0",
	platforms: ["web", "ios", "android"],
	orientation: "default",
	icon: "./public/favicon-96x96-dark.png",
	userInterfaceStyle: "automatic",
	ios: {
		supportsTablet: true,
	},
	android: {
		package: IS_DEV ? "dev.zoriya.kyoo.dev" : "dev.zoriya.kyoo",
		versionCode: process.env.ANDROID_VERSION_CODE
			? Number(process.env.ANDROID_VERSION_CODE)
			: undefined,
		adaptiveIcon: {
			foregroundImage: "./public/android-adaptive-icon.png",
			backgroundColor: "#6b00b8",
		},
	},
	web: {
		bundler: "metro",
		favicon: "./public/icon.svg",
		output: "single",
	},
	// A tv build is prebuilt from the bare workflow, where expo-updates'
	// runtime-version policies are not supported: it would fail the prebuild and,
	// if it got past that, load a remote bundle built for the phone.
	updates: IS_TV
		? { enabled: false }
		: { url: updateUrl, fallbackToCacheTimeout: 0 },
	...(IS_TV ? {} : { runtimeVersion: { policy: "sdkVersion" as const } }),
	extra: {
		eas: {
			projectId: "55de6b52-c649-4a15-9a45-569ff5ed036c",
		},
	},
	plugins: [
		"expo-router",
		"expo-image",
		"expo-status-bar",
		[
			"@react-native-tvos/config-tv",
			{
				isTV: IS_TV,
				androidTVRequired: IS_TV,
				androidTVBanner: "./public/tv-banner.png",
			},
		],
		["./plugins/with-tv-dev-menu"],
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
		"react-native-omni",
		"./plugins/withNotificationIcon",
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
									path: "./node_modules/@expo-google-fonts/poppins/300Light/Poppins_300Light.ttf",
									weight: "300",
								},
								{
									path: "./node_modules/@expo-google-fonts/poppins/500Medium/Poppins_500Medium.ttf",
									weight: "500",
								},
							],
						},
						{
							fontFamily: "Sora",
							fontDefinitions: [
								{
									path: "./node_modules/@expo-google-fonts/sora/800ExtraBold/Sora_800ExtraBold.ttf",
									weight: "800",
								},
							],
						},
					],
				},
			},
		],
		[
			"expo-image-picker",
			{
				cameraPermission: false,
				microphonePermission: false,
			},
		],
	],
	experiments: {
		typedRoutes: true,
		reactCompiler: true,
	},
};
