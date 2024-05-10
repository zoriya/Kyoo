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

import { Stack, useLocalSearchParams } from "expo-router";
import { type ComponentType, useEffect } from "react";
import { StatusBar, type StatusBarProps } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import * as NavigationBar from "expo-navigation-bar";
import arrayShuffle from "array-shuffle";
import { type QueryPage, useHasPermission } from "@kyoo/models";
import { Unauthorized } from "@kyoo/ui";

const FullscreenProvider = () => {
	useEffect(() => {
		ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
		NavigationBar.setVisibilityAsync("hidden");
		return () => {
			ScreenOrientation.unlockAsync();
			NavigationBar.setVisibilityAsync("visible");
		};
	}, []);
	return null;
};

export const withRoute = <Props,>(
	Component: ComponentType<Props>,
	options?: Parameters<typeof Stack.Screen>[0] & {
		statusBar?: StatusBarProps;
		fullscreen?: boolean;
	},
	defaultProps?: Partial<Props>,
) => {
	const { statusBar, fullscreen, ...routeOptions } = options ?? {};
	const WithUseRoute = (props: any) => {
		const routeParams = useLocalSearchParams();
		const hasPermissions = useHasPermission((Component as QueryPage).requiredPermissions ?? []);

		if (!hasPermissions)
			return <Unauthorized missing={(Component as QueryPage).requiredPermissions!} />;

		return (
			<>
				{routeOptions && <Stack.Screen {...routeOptions} />}
				{statusBar && <StatusBar {...statusBar} />}
				{fullscreen && <FullscreenProvider />}
				<Component
					{...defaultProps}
					randomItems={arrayShuffle((Component as QueryPage).randomItems ?? [])}
					{...routeParams}
					{...props}
				/>
			</>
		);
	};

	const { ...all } = Component;
	Object.assign(WithUseRoute, { ...all });
	return WithUseRoute;
};
