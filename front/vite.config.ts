import { one } from "one/vite";
import type { UserConfig } from "vite";

export default {
	ssr: {
		noExternal: ["@tanstack/react-query", "@tanstack/react-query-devtools"],
	},
	server: {
		proxy: {
			"/api": {
				target: process.env.KYOO_URL ?? "http://back/api",
				changeOrigin: true,
				// without this we have two /api at the start
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
		},
	},
	plugins: [
		one({
			deps: {
				"@expo/html-elements": {
					"**/*.js": ["jsx"],
				},
				"inline-style-prefixer/lib": "interop",
				yoshiki: {
					"**/*.tsx": ["jsx"],
				},
			},
		}),
	],
} satisfies UserConfig;
