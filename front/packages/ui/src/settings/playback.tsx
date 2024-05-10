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

import { Select } from "@kyoo/primitives";
import { useLocalSetting } from "@kyoo/models";
import { useTranslation } from "react-i18next";
import { useSetAtom } from "jotai";
import { Preference, SettingsContainer, useSetting } from "./base";
import { PlayMode, playModeAtom } from "../player/state";

import PlayModeI from "@material-symbols/svg-400/rounded/display_settings-fill.svg";
import AudioLanguage from "@material-symbols/svg-400/rounded/music_note-fill.svg";
import SubtitleLanguage from "@material-symbols/svg-400/rounded/closed_caption-fill.svg";

// I gave up on finding a way to retrive this using the Intl api (probably does not exist)
// Simply copy pasted the list of languages from https://www.localeplanet.com/api/codelist.json
// biome-ignore format: way too long
const allLanguages = ["af", "agq", "ak", "am", "ar", "as", "asa", "ast", "az", "bas", "be", "bem", "bez", "bg", "bm", "bn", "bo", "br", "brx", "bs", "ca", "ccp", "ce", "cgg", "chr", "ckb", "cs", "cy", "da", "dav", "de", "dje", "dsb", "dua", "dyo", "dz", "ebu", "ee", "el", "en", "eo", "es", "et", "eu", "ewo", "fa", "ff", "fi", "fil", "fo", "fr", "fur", "fy", "ga", "gd", "gl", "gsw", "gu", "guz", "gv", "ha", "haw", "he", "hi", "hr", "hsb", "hu", "hy", "id", "ig", "ii", "is", "it", "ja", "jgo", "jmc", "ka", "kab", "kam", "kde", "kea", "khq", "ki", "kk", "kkj", "kl", "kln", "km", "kn", "ko", "kok", "ks", "ksb", "ksf", "ksh", "kw", "ky", "lag", "lb", "lg", "lkt", "ln", "lo", "lrc", "lt", "lu", "luo", "luy", "lv", "mas", "mer", "mfe", "mg", "mgh", "mgo", "mk", "ml", "mn", "mr", "ms", "mt", "mua", "my", "mzn", "naq", "nb", "nd", "nds", "ne", "nl", "nmg", "nn", "nnh", "nus", "nyn", "om", "or", "os", "pa", "pl", "ps", "pt", "qu", "rm", "rn", "ro", "rof", "ru", "rw", "rwk", "sah", "saq", "sbp", "se", "seh", "ses", "sg", "shi", "si", "sk", "sl", "smn", "sn", "so", "sq", "sr", "sv", "sw", "ta", "te", "teo", "tg", "th", "ti", "to", "tr", "tt", "twq", "tzm", "ug", "uk", "ur", "uz", "vai", "vi", "vun", "wae", "wo", "xog", "yav", "yi", "yo", "yue", "zgh", "zh", "zu",];

export const PlaybackSettings = () => {
	const { t, i18n } = useTranslation();
	const [playMode, setDefaultPlayMode] = useLocalSetting("playmode", "direct");
	const setCurrentPlayMode = useSetAtom(playModeAtom);
	const [audio, setAudio] = useSetting("audioLanguage")!;
	const [subtitle, setSubtitle] = useSetting("subtitleLanguage")!;
	const languages = new Intl.DisplayNames([i18n.language ?? "en"], {
		type: "language",
		languageDisplay: "standard",
	});

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
					onValueChange={(value) => {
						setDefaultPlayMode(value);
						setCurrentPlayMode(value === "direct" ? PlayMode.Direct : PlayMode.Hls);
					}}
					values={["direct", "auto"]}
					getLabel={(key) => t(`player.${key}`)}
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
					values={["default", ...allLanguages]}
					getLabel={(key) =>
						key === "default" ? t("mediainfo.default") : languages.of(key) ?? key
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
					values={["none", "default", ...allLanguages]}
					getLabel={(key) =>
						key === "none"
							? t("settings.playback.subtitleLanguage.none")
							: key === "default"
								? t("mediainfo.default")
								: languages.of(key) ?? key
					}
				/>
			</Preference>
		</SettingsContainer>
	);
};
