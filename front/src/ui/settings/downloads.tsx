import Download from "@material-symbols/svg-400/rounded/download.svg";
import HighQuality from "@material-symbols/svg-400/rounded/high_quality.svg";
import Cellular from "@material-symbols/svg-400/rounded/signal_cellular_alt.svg";
import { useTranslation } from "react-i18next";
import type { Quality } from "~/models";
import { Select } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { useDownloadSettings } from "~/ui/download";
import { qualityHeights } from "~/ui/downloads/quality";
import { Preference, SettingsContainer, useSetting } from "./base";

export const DownloadSettings = () => {
	const { t } = useTranslation();
	const [settings, setSettings] = useDownloadSettings();
	const account = useAccount();
	const [quality, setQuality] = useSetting("defaultDownloadQuality", "ask");

	return (
		<SettingsContainer title={t("settings.downloads.label")}>
			{account && (
				<Preference
					icon={HighQuality}
					label={t("settings.downloads.quality.label")}
					description={t("settings.downloads.quality.description")}
				>
					<Select
						label={t("settings.downloads.quality.label")}
						value={quality}
						onValueChange={(value) => setQuality(value)}
						values={[
							"ask",
							"original",
							...(Object.keys(qualityHeights) as Quality[]),
						]}
						getLabel={(key) =>
							key === "ask"
								? t("settings.downloads.quality.ask")
								: key === "original"
									? t("downloads.original")
									: key
						}
					/>
				</Preference>
			)}
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
