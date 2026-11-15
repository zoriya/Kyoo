import fs from "node:fs";
import path from "node:path";
import {
	AndroidConfig,
	type ConfigPlugin,
	withAndroidStyles,
	withDangerousMod,
	withMainActivity,
} from "expo/config-plugins";

// Android TV 12+ ignores the SplashScreen API (it shows nothing or a plain color),
// and expo-splash-screen blocks the first draw until react renders, so the TV
// shows nothing while the js loads. Instead, draw the logo as the window background
// and let the activity draw right away; react paints over it once ready.
const drawable = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
  <item>
    <bitmap android:gravity="center" android:src="@drawable/splashscreen_logo"/>
  </item>
</layer-list>
`;

export const withTvSplash: ConfigPlugin = (config) => {
	config = withDangerousMod(config, [
		"android",
		async (config) => {
			const file = path.join(
				config.modRequest.platformProjectRoot,
				"app/src/main/res/drawable/tv_splash.xml",
			);
			await fs.promises.mkdir(path.dirname(file), { recursive: true });
			await fs.promises.writeFile(file, drawable);
			return config;
		},
	]);
	config = withAndroidStyles(config, (config) => {
		config.modResults = AndroidConfig.Styles.assignStylesValue(
			config.modResults,
			{
				add: true,
				parent: AndroidConfig.Styles.getAppThemeGroup(),
				name: "android:windowBackground",
				value: "@drawable/tv_splash",
			},
		);
		return config;
	});
	config = withMainActivity(config, (config) => {
		if (config.modResults.contents.includes("SplashScreenManager.hide()"))
			return config;
		config.modResults.contents = config.modResults.contents.replace(
			/^(\s*)super\.onCreate\(null\)/m,
			"$1SplashScreenManager.hide()\n$&",
		);
		return config;
	});
	return config;
};

export default withTvSplash;
