import intl from "langmap";

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
