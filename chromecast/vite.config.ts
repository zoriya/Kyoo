import type * as http from "node:http";
import { type Connect, defineConfig, type Plugin } from "vite";

// Chromecast aggressively caches the receiver app; if index.html is cacheable
// the device keeps loading a stale build (old hashed asset) after a redeploy.
// Serve the HTML entrypoint with no-store so the device always fetches fresh;
// the content-hashed /assets are safe to leave cacheable.
const headers = (req: Connect.IncomingMessage, res: http.ServerResponse) => {
	res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
	res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
	const url: string = req.url ?? "/";
	if (!url.startsWith("/assets/")) {
		res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
	}
};

const crossOriginIsolation: Plugin = {
	name: "cross-origin-isolation",
	configureServer(server) {
		server.middlewares.use((req, res, next) => {
			headers(req, res);
			next();
		});
	},
	configurePreviewServer(server) {
		server.middlewares.use((req, res, next) => {
			headers(req, res);
			next();
		});
	},
};

export default defineConfig({
	plugins: [crossOriginIsolation],
	build: {
		target: "chrome90",
		outDir: "dist",
	},
	worker: {
		format: "es",
	},
	server: {
		allowedHosts: true,
		hmr: false,
	},
});
