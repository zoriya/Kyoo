import type { Track } from "@kyoo/models";
import { useTranslation } from "react-i18next";

export const useDisplayName = () => {
	const { i18n } = useTranslation();

	return (sub: Track) => {
		const languageNames = new Intl.DisplayNames([i18n.language ?? "en"], { type: "language" });
		const lng = sub.language ? languageNames.of(sub.language) : undefined;

		if (lng && sub.title && sub.title !== lng) return `${lng} - ${sub.title}`;
		if (lng) return lng;
		if (sub.title) return sub.title;
		return `Unknown (${sub.index})`;
	};
};
