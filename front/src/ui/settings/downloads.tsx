import Download from "@material-symbols/svg-400/rounded/download.svg";
import Cellular from "@material-symbols/svg-400/rounded/signal_cellular_alt.svg";
import { useTranslation } from "react-i18next";
import { Select } from "~/primitives";
import { useDownloadSettings } from "~/ui/download";
import { Preference, SettingsContainer } from "./base";

export const DownloadSettings = () => {
	const { t } = useTranslation();
	const [settings, setSettings] = useDownloadSettings();

	return (
		<SettingsContainer title={t("settings.downloads.label")}>
			<Preference
				icon={Download}
				label={t("settings.downloads.maxConcurrent.label")}
				description={t("settings.downloads.maxConcurrent.description")}
			>
				<Select
					label={t("settings.downloads.maxConcurrent.label")}
					value={settings.maxConcurrent.toString()}
					onValueChange={(value) =>
						setSettings({ maxConcurrent: Number(value) })
					}
					values={["1", "2", "3", "4", "5"]}
					getLabel={(key) => key}
				/>
			</Preference>
			<Preference
				icon={Cellular}
				label={t("settings.downloads.allowCellular.label")}
				description={t("settings.downloads.allowCellular.description")}
			>
				<Select
					label={t("settings.downloads.allowCellular.label")}
					value={settings.allowCellular ? "on" : "off"}
					onValueChange={(value) =>
						setSettings({ allowCellular: value === "on" })
					}
					values={["on", "off"]}
					getLabel={(key) => t(`settings.downloads.allowCellular.${key}`)}
				/>
			</Preference>
		</SettingsContainer>
	);
};
