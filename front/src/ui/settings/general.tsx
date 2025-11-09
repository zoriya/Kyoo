// import Theme from "@material-symbols/svg-400/outlined/dark_mode.svg";
import Language from "@material-symbols/svg-400/outlined/language.svg";
import Android from "@material-symbols/svg-400/rounded/android.svg";
import Public from "@material-symbols/svg-400/rounded/public.svg";
import { useTranslation } from "react-i18next";
import { Link, Select } from "~/primitives";
import { supportedLanguages } from "~/providers/translations.compile";
import { useLanguageName } from "~/track-utils";
import { Preference, SettingsContainer } from "./base";

export const GeneralSettings = () => {
	const { t, i18n } = useTranslation();
	// const theme = useUserTheme("auto");
	const getLanguageName = useLanguageName();

	return (
		<SettingsContainer title={t("settings.general.label")}>
			{/* <Preference */}
			{/* 	icon={Theme} */}
			{/* 	label={t("settings.general.theme.label")} */}
			{/* 	description={t("settings.general.theme.description")} */}
			{/* > */}
			{/* 	<Select */}
			{/* 		label={t("settings.general.theme.label")} */}
			{/* 		value={theme} */}
			{/* 		onValueChange={(value) => setUserTheme(value)} */}
			{/* 		values={["auto", "light", "dark"]} */}
			{/* 		getLabel={(key) => t(`settings.general.theme.${key}`)} */}
			{/* 	/> */}
			{/* </Preference> */}
			<Preference
				icon={Language}
				label={t("settings.general.language.label")}
				description={t("settings.general.language.description")}
			>
				<Select
					label={t("settings.general.language.label")}
					value={i18n.resolvedLanguage!}
					onValueChange={(value) => i18n.changeLanguage(value)}
					values={supportedLanguages}
					getLabel={(key) => getLanguageName(key) ?? key}
				/>
			</Preference>
		</SettingsContainer>
	);
};

export const About = () => {
	const { t } = useTranslation();

	return (
		<SettingsContainer title={t("settings.about.label")}>
			<Link
				href="https://github.com/zoriya/kyoo/releases/latest/download/kyoo.apk"
				target="_blank"
			>
				<Preference
					icon={Android}
					label={t("settings.about.android-app.label")}
					description={t("settings.about.android-app.description")}
				/>
			</Link>
			<Link href="https://github.com/zoriya/kyoo" target="_blank">
				<Preference
					icon={Public}
					label={t("settings.about.git.label")}
					description={t("settings.about.git.description")}
				/>
			</Link>
		</SettingsContainer>
	);
};
