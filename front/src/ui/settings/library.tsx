import Collections from "@material-symbols/svg-400/rounded/collections_bookmark.svg";
import { useTranslation } from "react-i18next";
import { Select } from "~/primitives";
import { Preference, SettingsContainer, useSetting } from "./base";

export const LibrarySettings = () => {
	const { t } = useTranslation();
	const [showCollectionItems, setShowCollectionItems] = useSetting(
		"showCollectionItems",
	)!;

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
		</SettingsContainer>
	);
};
