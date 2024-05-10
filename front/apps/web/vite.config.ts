import react from "@vitejs/plugin-react";
import reactNativeWeb from "vite-plugin-react-native-web";
import vike from "vike/plugin";
import type { UserConfig } from "vite";
import path from "node:path";

export default {
	server: {
		host: "0.0.0.0",
	},
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
		},
	},
	plugins: [react(), vike(), reactNativeWeb()],
} satisfies UserConfig;
