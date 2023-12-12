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
import { NavbarRight, NavbarTitle } from "@kyoo/ui";
import { LoadingIndicator } from "@kyoo/ui/src/player/components/hover";
import { Redirect, Stack } from "expo-router";
import { useContext, useRef } from "react";
import { useTheme } from "yoshiki/native";

export default function SignGuard() {
	const theme = useTheme();
	// TODO: support guest accounts on mobile too.
	const account = useAccount();
	const { loading, error } = useContext(ConnectionErrorContext);
	const wasRendered = useRef(false);

	// While loading, keep the splashcreen if possible. if not, display a spinner.
	if (loading) return wasRendered.current ? <LoadingIndicator /> : null;
	wasRendered.current = true;

	if (error) return <Redirect href={"/connection-error"} />;
	if (!account) return <Redirect href="/login" />;
	return (
		<Stack
			screenOptions={{
				navigationBarColor: theme.variant.background,
				headerTitle: () => <NavbarTitle />,
				headerRight: () => <NavbarRight />,
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
