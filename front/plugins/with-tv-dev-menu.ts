import {
	AndroidConfig,
	type ConfigPlugin,
	withAndroidManifest,
} from "expo/config-plugins";

const { addMetaDataItemToMainApplication, getMainApplicationOrThrow } =
	AndroidConfig.Manifest;

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
