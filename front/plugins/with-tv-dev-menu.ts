import {
	AndroidConfig,
	type ConfigPlugin,
	withAndroidManifest,
} from "expo/config-plugins";

const { addMetaDataItemToMainApplication, getMainApplicationOrThrow } =
	AndroidConfig.Manifest;

// expo-dev-menu's ui is touch only: the floating action button grabs the dpad
// focus away from the app and the bottom sheet it opens can't be navigated with
// a remote. Everything is turned off by default, the menu can still be opened
// with the `menu` key of the remote (`adb shell input keyevent 82`).
const metadata = {
	EXDevMenuShowFloatingActionButton: "false",
	EXDevMenuShowsAtLaunch: "false",
	EXDevMenuIsOnboardingFinished: "true",
};

export const withTvDevMenu: ConfigPlugin = (config) =>
	withAndroidManifest(config, (config) => {
		if (process.env.EXPO_TV !== "1") return config;

		const app = getMainApplicationOrThrow(config.modResults);
		for (const [name, value] of Object.entries(metadata))
			addMetaDataItemToMainApplication(app, name, value, "value");
		return config;
	});

export default withTvDevMenu;
