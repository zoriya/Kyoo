import { one } from "one/vite";
import type { UserConfig } from "vite";
import svgr from "vite-plugin-svgr";

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
				"inline-style-prefixer/lib": "interop",
				yoshiki: {
					"**/*.tsx": ["jsx"],
				},
			},
		}),
		svgr({
			include: "**/*.svg",
			svgrOptions: {
				native: true,
			},
		}),
	],
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
} satisfies UserConfig;
