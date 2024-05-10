/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

const IS_DEV = process.env.APP_VARIANT === "development";

// Defined outside the config because dark splashscreen needs to be platform specific.
const splash = {
	image: "./assets/icon.png",
	resizeMode: "contain",
	backgroundColor: "#eff1f5",
	dark: {
		image: "./assets/icon.png",
		resizeMode: "contain",
		backgroundColor: "#1e1e2e",
	},
};

const config = {
	expo: {
		name: IS_DEV ? "Kyoo Development" : "Kyoo",
		slug: "kyoo",
		scheme: "kyoo",
		version: "1.0.0",
		orientation: "default",
		icon: "./assets/icon.png",
		userInterfaceStyle: "automatic",
		splash,
		assetBundlePatterns: ["**/*"],
		ios: {
			supportsTablet: true,
		},
		android: {
			package: IS_DEV ? "dev.zoriya.kyoo.dev" : "dev.zoriya.kyoo",
			adaptiveIcon: {
				foregroundImage: "./assets/icon.png",
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
		plugins: ["expo-build-properties", "expo-localization"],
	},
};
export default config;
