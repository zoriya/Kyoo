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

import { ReactNode } from "react";
import { Container } from "./container";
import { Portal } from "@gorhom/portal";
import { SwitchVariant, YoshikiFunc } from "./themes";
import { View } from "react-native";
import { imageBorderRadius } from "./constants";
import { px } from "yoshiki/native";
import { ts } from "./utils";

export const Popup = ({ children }: { children: ReactNode | YoshikiFunc<ReactNode> }) => {
	return (
		<Portal>
			<SwitchVariant>
				{({ css, theme }) => (
					<View
						{...css({
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							bg: (theme) => theme.themeOverlay,
							justifyContent: "center",
							alignItems: "center",
						})}
					>
						<Container
							{...css({
								borderRadius: px(imageBorderRadius),
								padding: ts(4),
								gap: ts(2),
								bg: (theme) => theme.background,
							})}
						>
							{typeof children === "function" ? children({ css, theme }) : children}
						</Container>
					</View>
				)}
			</SwitchVariant>
		</Portal>
	);
};
