/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

const path = require("node:path");
const CopyPlugin = require("copy-webpack-plugin");
const DefinePlugin = require("webpack").DefinePlugin;

const suboctopus = path.resolve(path.dirname(require.resolve("jassub")), "../dist");

/**
 * @type {import("next").NextConfig}
 */
const nextConfig = {
	swcMinify: true,
	reactStrictMode: true,
	output: "standalone",
	webpack: (config) => {
		config.plugins = [
			...config.plugins,
			new CopyPlugin({
				patterns: [
					{
						context: suboctopus,
						from: "*",
						filter: (filepath) => !filepath.endsWith(".es.js"),
						to: "static/chunks/",
					},
				],
			}),
		];
		config.resolve = {
			...config.resolve,
			alias: {
				...config.resolve.alias,
				"react-native$": "react-native-web",
				"react-native/Libraries/Image/AssetRegistry$":
					"react-native-web/dist/modules/AssetRegistry",
			},
			extensions: [".web.ts", ".web.tsx", ".web.js", ".web.jsx", ...config.resolve.extensions],
		};

		if (!config.plugins) config.plugins = [];
		config.plugins.push(
			new DefinePlugin({
				__DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
			}),
		);

		config.module.rules.push({
			test: /\.svg$/i,
			issuer: /\.[jt]sx?$/,
			use: [
				{
					loader: "@svgr/webpack",
					options: {
						native: true,
						svgoConfig: {
							plugins: [
								{
									name: "removeViewBox",
									active: false,
								},
							],
						},
					},
				},
			],
		});
		return config;
	},
	i18n: {
		locales: ["en", "fr"],
		defaultLocale: "en",
	},
	transpilePackages: [
		"@kyoo/ui",
		"@kyoo/primitives",
		"@kyoo/models",
		"solito",
		"react-native",
		"react-native-web",
		"react-native-svg",
		"react-native-reanimated",
		"react-native-mmkv",
		"moti",
		"yoshiki",
		"@expo/vector-icons",
		"@expo/html-elements",
		"expo-font",
		"expo-asset",
		"expo-av",
		"expo-modules-core",
		"expo-linear-gradient",
		"expo-image-picker",
	],
	experimental: {
		outputFileTracingRoot: path.join(__dirname, "../../"),
	},
};

if (process.env.NODE_ENV !== "production") {
	nextConfig.rewrites = async () => [
		{
			source: "/api/:path*",
			destination: process.env.KYOO_URL
				? `${process.env.KYOO_URL}/:path*`
				: "http://localhost:5000/:path*",
		},
	];
}

module.exports = nextConfig;
