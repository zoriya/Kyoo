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
		if (sub.index !== null) return `Unknown (${sub.index})`;
		return "Unknown";
	};
};

const seenNativeNames = new Set();

export const languageCodes = Object.keys(intl)
	.filter((x) => {
		const nativeName = intl[x]?.nativeName;

		// Only include if nativeName is unique and defined
		if (nativeName && !seenNativeNames.has(nativeName)) {
			seenNativeNames.add(nativeName);
			return true;
		}
		return false;
	})
	.filter((x) => !x.includes("@"));
