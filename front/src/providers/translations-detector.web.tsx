import LanguageDetector from "i18next-browser-languagedetector";

export const languageDetector = new LanguageDetector(null, {
	order: ["querystring", "cookie", "navigator", "path", "subdomain"],
	caches: ["cookie"],
	cookieMinutes: 525600, // 1 years
});
