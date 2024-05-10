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

import { Account, ConnectionErrorContext, useAccount } from "@kyoo/models";
import { NavbarProfile, NavbarTitle } from "@kyoo/ui";
import { Redirect, Stack } from "expo-router";
import { useContext, useRef } from "react";
import { useTheme } from "yoshiki/native";

export default function PublicLayout() {
	const theme = useTheme();
	const account = useAccount();
	const { error } = useContext(ConnectionErrorContext);
	const oldAccount = useRef<Account | null>(account);

	if (account && !error && account !== oldAccount.current) return <Redirect href="/" />;
	oldAccount.current = account;

	return (
		<Stack
			screenOptions={{
				headerTitle: () => <NavbarTitle />,
				headerRight: () => <NavbarProfile />,
				contentStyle: {
					backgroundColor: theme.background,
				},
				headerStyle: {
					backgroundColor: theme.accent,
				},
				headerTintColor: theme.colors.white,
			}}
		/>
	);
}
