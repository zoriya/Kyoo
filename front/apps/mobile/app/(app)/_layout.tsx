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

import { ConnectionErrorContext, useAccount } from "@kyoo/models";
import { CircularProgress } from "@kyoo/primitives";
import { NavbarRight, NavbarTitle } from "@kyoo/ui";
import { useNetInfo } from "@react-native-community/netinfo";
import { Redirect, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useContext, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "yoshiki/native";

export default function SignGuard() {
	const insets = useSafeAreaInsets();
	const theme = useTheme();
	// TODO: support guest accounts on mobile too.
	const account = useAccount();
	const { loading, error } = useContext(ConnectionErrorContext);
	const netInfo = useNetInfo();

	useEffect(() => {
		if (!loading) SplashScreen.hideAsync();
	}, [loading]);

	if (loading) return <CircularProgress />;
	if (error && netInfo.isConnected) return <Redirect href={"/connection-error"} />;
	if (!account) return <Redirect href="/login" />;
	return (
		<Stack
			screenOptions={{
				navigationBarColor: "transparent",
				headerTitle: () => <NavbarTitle />,
				headerRight: () => <NavbarRight />,
				contentStyle: {
					backgroundColor: theme.background,
					paddingLeft: insets.left,
					paddingRight: insets.right,
				},
				headerStyle: {
					backgroundColor: theme.accent,
				},
				headerTintColor: theme.colors.white,
			}}
		/>
	);
}
