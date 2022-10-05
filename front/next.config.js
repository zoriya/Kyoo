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

const CopyPlugin = require("copy-webpack-plugin");

/**
 * @type {import("next").NextConfig}
 */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
	output: "standalone",
	webpack: (config) => {
		config.plugins = [
			...config.plugins,
			new CopyPlugin({
				patterns: [
					{
						context: "node_modules/@jellyfin/libass-wasm/dist/js/",
						from: "*",
						to: "static/chunks/",
					},
				],
			}),
		];
		return config;
	},
	async redirects() {
		return [
			{
				source: "/",
				destination: "/browse",
				permanent: true,
			},
		];
	},
	i18n: {
		locales: ["en", "fr"],
		defaultLocale: "en",
	},
};

if (process.env.NODE_ENV !== "production") {
	nextConfig.rewrites = async () => [
		{ source: "/api/:path*", destination: process.env.KYOO_URL ?? "http://localhost:5000/:path*" },
	];
}

module.exports = nextConfig;
