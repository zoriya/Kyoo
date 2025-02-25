export const { TranslationsProvider } =
	typeof window === "undefined"
		? await import("./translations.web.ssr")
		: await import("./translations.web.client");
