import { one } from "one/vite";
// Typed as UserConfig for handy autocomplete
import type { UserConfig } from "vite";

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
				"inline-style-prefixer/lib": "interop",
				yoshiki: "interop",
			},
		}),
	],
} satisfies UserConfig;
