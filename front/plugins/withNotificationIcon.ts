import fs from "node:fs";
import path from "node:path";
import { type ConfigPlugin, withDangerousMod } from "@expo/config-plugins";

const ICON = "./public/notification-icon.png";

export const withNotificationIcon: ConfigPlugin = (config) => {
	return withDangerousMod(config, [
		"android",
		async (modConfig) => {
			const res = path.join(
				modConfig.modRequest.projectRoot,
				"android/app/src/main/res",
			);

			// the icon is 96px, so xxxhdpi to make it a 24dp icon (android downscales it for the
			// lower densities)
			await fs.promises.mkdir(path.join(res, "drawable-xxxhdpi"), {
				recursive: true,
			});
			await fs.promises.copyFile(
				path.resolve(modConfig.modRequest.projectRoot, ICON),
				path.join(res, "drawable-xxxhdpi", "notification_icon.png"),
			);

			await fs.promises.mkdir(path.join(res, "values"), { recursive: true });
			await fs.promises.writeFile(
				path.join(res, "values", "media3.xml"),
				'<?xml version="1.0" encoding="utf-8"?>\n' +
					"<resources>\n" +
					'\t<drawable name="media3_notification_small_icon">@drawable/notification_icon</drawable>\n' +
					"</resources>\n",
			);
			return modConfig;
		},
	]);
};

export default withNotificationIcon;
