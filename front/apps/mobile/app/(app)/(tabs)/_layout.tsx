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

import { Icon } from "@kyoo/primitives";
import Browse from "@material-symbols/svg-400/rounded/browse-fill.svg";
import Downloading from "@material-symbols/svg-400/rounded/downloading-fill.svg";
import Home from "@material-symbols/svg-400/rounded/home-fill.svg";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
	const { t } = useTranslation();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					tabBarLabel: t("navbar.home"),
					tabBarIcon: ({ color, size }) => <Icon icon={Home} color={color} size={size} />,
				}}
			/>
			<Tabs.Screen
				name="browse"
				options={{
					tabBarLabel: t("navbar.browse"),
					tabBarIcon: ({ color, size }) => <Icon icon={Browse} color={color} size={size} />,
				}}
			/>
			<Tabs.Screen
				name="downloads"
				options={{
					tabBarLabel: t("navbar.download"),
					tabBarIcon: ({ color, size }) => <Icon icon={Downloading} color={color} size={size} />,
				}}
			/>
		</Tabs>
	);
}
