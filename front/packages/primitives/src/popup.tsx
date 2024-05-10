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

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Container } from "./container";
import { usePortal } from "@gorhom/portal";
import { ContrastArea, SwitchVariant, type YoshikiFunc } from "./themes";
import { View, ScrollView } from "react-native";
import { imageBorderRadius } from "./constants";
import { px, vh } from "yoshiki/native";
import { ts } from "./utils";

export const Popup = ({ children, ...props }: { children: ReactNode | YoshikiFunc<ReactNode> }) => {
	return (
		<ContrastArea mode="user">
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
							{...css(
								{
									borderRadius: px(imageBorderRadius),
									paddingHorizontal: 0,
									bg: (theme) => theme.background,
									overflow: "hidden",
								},
								props,
							)}
						>
							<ScrollView
								contentContainerStyle={{
									paddingHorizontal: px(15),
									paddingVertical: ts(4),
									gap: ts(2),
								}}
								{...css({
									maxHeight: vh(95),
									flexGrow: 0,
									flexShrink: 1,
								})}
							>
								{typeof children === "function" ? children({ css, theme }) : children}
							</ScrollView>
						</Container>
					</View>
				)}
			</SwitchVariant>
		</ContrastArea>
	);
};

export const usePopup = () => {
	const { addPortal, removePortal } = usePortal();
	const [current, setPopup] = useState<ReactNode>();
	const close = useCallback(() => setPopup(undefined), []);

	useEffect(() => {
		addPortal("popup", current);
		return () => removePortal("popup");
	}, [current, addPortal, removePortal]);

	return [setPopup, close] as const;
};
