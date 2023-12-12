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
import { Tabs } from "expo-router";
import { useTheme } from "yoshiki/native";
import Home from "@material-symbols/svg-400/rounded/home-fill.svg";
import Browse from "@material-symbols/svg-400/rounded/browse-fill.svg";

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					tabBarLabel: "Home",
					tabBarIcon: ({ color, size }) => <Icon icon={Home} color={color} size={size} />,
				}}
			/>
			<Tabs.Screen
				name="browse"
				options={{
					tabBarLabel: "Browse",
					tabBarIcon: ({ color, size }) => <Icon icon={Browse} color={color} size={size} />,
				}}
			/>
		</Tabs>
	);
}
