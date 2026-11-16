import Collections from "@material-symbols/svg-400/rounded/collections_bookmark.svg";
import Translate from "@material-symbols/svg-400/rounded/translate.svg";
import { useTranslation } from "react-i18next";
import { PreferOriginal } from "~/models/utils/images";
import { Select } from "~/primitives";
import { Preference, SettingsContainer, useSetting } from "./base";

export const LibrarySettings = () => {
	const { t } = useTranslation();
	const [showCollectionItems, setShowCollectionItems] = useSetting(
		"showCollectionItems",
	)!;
	const [preferOriginal, setPreferOriginal] = useSetting("preferOriginal")!;

	return (
		<SettingsContainer title={t("settings.library.label")}>
			<Preference
				icon={Collections}
				label={t("settings.library.showCollectionItems.label")}
				description={t("settings.library.showCollectionItems.description")}
			>
				<Select
					label={t("settings.library.showCollectionItems.label")}
					value={showCollectionItems ? "on" : "off"}
					onValueChange={(value) => setShowCollectionItems(value === "on")}
					values={["on", "off"]}
					getLabel={(key) => t(`settings.library.showCollectionItems.${key}`)}
				/>
			</Preference>
			<Preference
				icon={Translate}
				label={t("settings.library.preferOriginal.label")}
				description={t("settings.library.preferOriginal.description")}
			>
				<Select
					label={t("settings.library.preferOriginal.label")}
					value={preferOriginal}
					onValueChange={setPreferOriginal}
					values={PreferOriginal.options}
					getLabel={(key) => t(`settings.library.preferOriginal.${key}`)}
				/>
			</Preference>
		</SettingsContainer>
	);
};
