import { one } from "one/vite";
import type { UserConfig } from "vite";
import svgr from "vite-plugin-svgr";
import { resolvePath } from '@vxrn/resolve'

export default {
	ssr: {
		noExternal: ["@tanstack/react-query", "@tanstack/react-query-devtools"],
	},
	esbuild: {
		include: [/.tsx?$/],
	},
	resolve: {
		alias: {
			'@react-native/assets-registry/registry': resolvePath('react-native-web/dist/modules/AssetRegistry/index.js'),
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
