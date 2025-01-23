// Typed as UserConfig for handy autocomplete
import type { UserConfig } from "vite";
import { one } from "one/vite";

export default {
	ssr: {
		// needed to fix ssr error of react-query
		noExternal: true,
	},
	plugins: [
		one({
			deps: {
				"@expo/html-elements": {
					"**/*.js": ["jsx"],
				},
				"inline-style-prefixer": "interop",
				"inline-style-prefixer/**": "interop",
			},
		}),
	],
} satisfies UserConfig;
