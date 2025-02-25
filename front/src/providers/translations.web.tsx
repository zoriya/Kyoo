// use native version during ssr
export const { TranslationsProvider } =
	typeof window === "undefined"
		? await import("./translations")
		: await import("./translations.web.client");
