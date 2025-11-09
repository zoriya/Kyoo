import SubtitleLanguage from "@material-symbols/svg-400/rounded/closed_caption-fill.svg";
import PlayModeI from "@material-symbols/svg-400/rounded/display_settings-fill.svg";
import AudioLanguage from "@material-symbols/svg-400/rounded/music_note-fill.svg";
import { useTranslation } from "react-i18next";
import { Select } from "~/primitives";
import { useLocalSetting } from "~/providers/settings";
import { useLanguageName } from "~/track-utils";
import { Preference, SettingsContainer, useSetting } from "./base";
import langmap from "langmap";

const seenNativeNames = new Set();
export const languageCodes = Object.keys(langmap)
	.filter((x) => {
		const nativeName = langmap[x]?.nativeName;

		// Only include if nativeName is unique and defined
		if (nativeName && !seenNativeNames.has(nativeName)) {
			seenNativeNames.add(nativeName);
			return true;
		}
		return false;
	})
	.filter((x) => !x.includes("@"));

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
						key === "default"
							? t("mediainfo.default")
							: (getLanguageName(key) ?? key)
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
					onValueChange={(value) =>
						setSubtitle(value === "none" ? null : value)
					}
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
