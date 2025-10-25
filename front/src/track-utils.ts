import intl from "langmap";
import { useTranslation } from "react-i18next";
import type { Subtitle } from "./models";

export const useLanguageName = () => {
	return (lang: string) => intl[lang]?.nativeName;
};

export const useDisplayName = () => {
	const getLanguageName = useLanguageName();
	const { t } = useTranslation();

	return (sub: {
		language?: string | null;
		title?: string | null;
		index?: number | null;
	}) => {
		const lng = sub.language ? getLanguageName(sub.language) : null;

		if (lng && sub.title && sub.title !== lng) return `${lng} - ${sub.title}`;
		if (lng) return lng;
		if (sub.title) return sub.title;
		if (sub.index !== null) return `${t("mediainfo.unknown")} (${sub.index})`;
		return t("mediainfo.unknown");
	};
};

export const useSubtitleName = () => {
	const getDisplayName = useDisplayName();
	const { t } = useTranslation();

	return (sub: Subtitle) => {
		const name = getDisplayName(sub);
		const attributes = [name];

		if (sub.isDefault) attributes.push(t("mediainfo.default"));
		if (sub.isForced) attributes.push(t("mediainfo.forced"));
		if (sub.isHearingImpaired) attributes.push(t("mediainfo.hearing-impaired"));
		if (sub.isExternal) attributes.push(t("mediainfo.external"));

		return attributes.join(" - ");
	};
};
