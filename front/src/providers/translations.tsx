// use native version during ssr
export default typeof window === "undefined"
	? await import("./translations.native")
	: await import("./translations.web.client");
