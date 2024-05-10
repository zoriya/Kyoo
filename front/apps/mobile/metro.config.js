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

const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const defaultConfig = getDefaultConfig(projectRoot);

function addMonorepoSupport(config) {
	const workspaceRoot = path.resolve(projectRoot, "../..");

	return {
		...config,
		watchFolders: [...config.watchFolders, workspaceRoot],
		resolver: {
			...config.resolver,
			nodeModulesPaths: [
				...config.resolver.nodeModulesPaths,
				path.resolve(projectRoot, "node_modules"),
				path.resolve(workspaceRoot, "node_modules"),
			],
			disableHierarchicalLookup: true,
		},
	};
}

function addSvgTransformer(config) {
	return {
		...config,
		transformer: {
			...config.transformer,
			babelTransformerPath: require.resolve("react-native-svg-transformer"),
		},
		resolver: {
			...config.resolver,
			assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
			sourceExts: [...config.resolver.sourceExts, "svg"],
		},
	};
}

module.exports = addMonorepoSupport(
	addSvgTransformer({
		...defaultConfig,
		resolver: {
			...defaultConfig.resolver,
			requireCycleIgnorePatterns: [...defaultConfig.resolver.requireCycleIgnorePatterns, /.*/],
		},
	}),
);
