import { createMiddleware, setServerData } from "one";
import { supportedLanguages } from "~/providers/translations.web.ssr";

export default createMiddleware(({ request, next }) => {
	const systemLanguage = request.headers
		.get("accept-languages")
		?.split(",")
		.map((x) => {
			const [lang, q] = x.trim().split(";q=");
			return [lang, q ? Number.parseFloat(q) : 1] as const;
		})
		.sort(([_, q1], [__, q2]) => q1 - q2)
		.flatMap(([lang]) => {
			const [base, spec] = lang.split("-");
			if (spec) return [lang, base];
			return [lang];
		})
		.find((x) => supportedLanguages.includes(x));
	setServerData("systemLanguage", systemLanguage);
	setServerData("cookies", request.headers.get("Cookies") ?? "");
	return next();
});
