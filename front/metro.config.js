const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

module.exports = (() => {
	const config = getDefaultConfig(__dirname);
	const { transformer, resolver } = config;

	config.transformer = {
		...transformer,
		babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
	};
	config.resolver = {
		...resolver,
		assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
		sourceExts: [...resolver.sourceExts, "svg"],
	};

	// jassub's wasm is multithreaded (SharedArrayBuffer), which requires the page
	// to be cross-origin isolated. Mirror the production headers on the dev server.
	config.server = {
		...config.server,
		enhanceMiddleware: (middleware) => (req, res, next) => {
			res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
			res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
			return middleware(req, res, next);
		},
	};

	return withUniwindConfig(config, {
		cssEntryFile: "./src/global.css",
	});
})();
