import { one } from "one/vite";
// Typed as UserConfig for handy autocomplete
import type { UserConfig } from "vite";

export default {
	ssr: {
		// needed to fix ssr error of react-query
		// noExternal: true,
	},
	// optimizeDeps: {
	// 	esbuildOptions: {
	// 		jsx: "automatic",
	// 	},
	// },
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
				// yoshiki: "exclude",
				// "yoshiki > inline-style-prefixer/**": "interop",
				// "yoshiki > inline-style-prefixer": "interop",
				// "yoshiki > inline-style-prefixer/lib": "interop",
			},
		}),
	],
} satisfies UserConfig;
