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

import { languageCodes, useLanguageName } from "../utils";
import { Preference, SettingsContainer, useSetting } from "./base";

import { useLocalSetting } from "@kyoo/models";
import { Select } from "@kyoo/primitives";
import SubtitleLanguage from "@material-symbols/svg-400/rounded/closed_caption-fill.svg";
import PlayModeI from "@material-symbols/svg-400/rounded/display_settings-fill.svg";
import AudioLanguage from "@material-symbols/svg-400/rounded/music_note-fill.svg";
import { useTranslation } from "react-i18next";

export const PlaybackSettings = () => {
	const { t } = useTranslation();
	const [playMode, setDefaultPlayMode] = useLocalSetting("playmode", "direct");
	const [audio, setAudio] = useSetting("audioLanguage")!;
	const [subtitle, setSubtitle] = useSetting("subtitleLanguage")!;
	const getLanguageName = useLanguageName();

	return (
		<SettingsContainer title={t("settings.playback.label")}>
			<Preference
				icon={PlayModeI}
				label={t("settings.playback.playmode.label")}
				description={t("settings.playback.playmode.description")}
			>
				<Select
					label={t("settings.playback.playmode.label")}
					value={playMode}
					onValueChange={(value) => setDefaultPlayMode(value)}
					values={["direct", "auto"]}
					getLabel={(key) => t(`player.${key}` as any)}
				/>
			</Preference>
			<Preference
				icon={AudioLanguage}
				label={t("settings.playback.audioLanguage.label")}
				description={t("settings.playback.audioLanguage.description")}
			>
				<Select
					label={t("settings.playback.audioLanguage.label")}
					value={audio}
					onValueChange={(value) => setAudio(value)}
					values={["default", ...languageCodes]}
					getLabel={(key) =>
						key === "default" ? t("mediainfo.default") : (getLanguageName(key) ?? key)
					}
				/>
			</Preference>
			<Preference
				icon={SubtitleLanguage}
				label={t("settings.playback.subtitleLanguage.label")}
				description={t("settings.playback.subtitleLanguage.description")}
			>
				<Select
					label={t("settings.playback.subtitleLanguage.label")}
					value={subtitle ?? "none"}
					onValueChange={(value) => setSubtitle(value === "none" ? null : value)}
					values={["none", "default", ...languageCodes]}
					getLabel={(key) =>
						key === "none"
							? t("settings.playback.subtitleLanguage.none")
							: key === "default"
								? t("mediainfo.default")
								: (getLanguageName(key) ?? key)
					}
				/>
			</Preference>
		</SettingsContainer>
	);
};
