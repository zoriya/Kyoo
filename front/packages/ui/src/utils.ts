import type { Track } from "@kyoo/models";
import intl from "langmap";

export const useLanguageName = () => {
	return (lang: string) => intl[lang]?.nativeName;
};

export const useDisplayName = () => {
	const getLanguageName = useLanguageName();

	return (sub: Track) => {
		const lng = sub.language ? getLanguageName(sub.language) : null;

		if (lng && sub.title && sub.title !== lng) return `${lng} - ${sub.title}`;
		if (lng) return lng;
		if (sub.title) return sub.title;
		return `Unknown (${sub.index})`;
	};
};
