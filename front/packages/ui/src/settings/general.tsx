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

import { deleteData, setUserTheme, storeData, useUserTheme } from "@kyoo/models";
import { Link, Select } from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { Preference, SettingsContainer } from "./base";

import Theme from "@material-symbols/svg-400/outlined/dark_mode.svg";
import Language from "@material-symbols/svg-400/outlined/language.svg";

import Android from "@material-symbols/svg-400/rounded/android.svg";
import Public from "@material-symbols/svg-400/rounded/public.svg";
import { useLanguageName } from "../utils";

export const GeneralSettings = () => {
	const { t, i18n } = useTranslation();
	const theme = useUserTheme("auto");
	const getLanguageName = useLanguageName();

	const changeLanguage = (lang: string) => {
		if (lang === "system") {
			i18n.changeLanguage(i18n.systemLanguage);
			deleteData("language");
			return;
		}
		storeData("language", lang);
		i18n.changeLanguage(lang);
	};

	return (
		<SettingsContainer title={t("settings.general.label")}>
			<Preference
				icon={Theme}
				label={t("settings.general.theme.label")}
				description={t("settings.general.theme.description")}
			>
				<Select
					label={t("settings.general.theme.label")}
					value={theme}
					onValueChange={(value) => setUserTheme(value)}
					values={["auto", "light", "dark"]}
					getLabel={(key) => t(`settings.general.theme.${key}`)}
				/>
			</Preference>
			<Preference
				icon={Language}
				label={t("settings.general.language.label")}
				description={t("settings.general.language.description")}
			>
				<Select
					label={t("settings.general.language.label")}
					value={i18n.resolvedLanguage! === i18n.systemLanguage ? "system" : i18n.resolvedLanguage!}
					onValueChange={(value) => changeLanguage(value)}
					values={["system", ...Object.keys(i18n.options.resources!)]}
					getLabel={(key) =>
						key === "system" ? t("settings.general.language.system") : (getLanguageName(key) ?? key)
					}
				/>
			</Preference>
		</SettingsContainer>
	);
};

export const About = () => {
	const { t } = useTranslation();

	return (
		<SettingsContainer title={t("settings.about.label")}>
			<Link href="https://github.com/zoriya/kyoo/releases/latest/download/kyoo.apk" target="_blank">
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
