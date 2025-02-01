import { one } from "one/vite";
import type { UserConfig } from "vite";

export default {
	ssr: {
		noExternal: ["@tanstack/react-query", "@tanstack/react-query-devtools"],
	},
	plugins: [
		one({
			deps: {
				"@expo/html-elements": {
					"**/*.js": ["jsx"],
				},
				"inline-style-prefixer": "interop",
				"inline-style-prefixer/**": "interop",
				"inline-style-prefixer/lib": "interop",
				yoshiki: {
					"**/*.tsx": ["jsx"],
				},
			},
		}),
	],
} satisfies UserConfig;
