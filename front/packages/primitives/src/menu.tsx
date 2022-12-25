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

import { Portal } from "@gorhom/portal";
import { ScrollView } from "moti";
import { ComponentType, createContext, ReactNode, useContext, useEffect, useState } from "react";
import { PressableProps, StyleSheet, Pressable } from "react-native";
import { percent, px, sm, useYoshiki, xl } from "yoshiki/native";
import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import { IconButton } from "./icons";
import { PressableFeedback } from "./links";
import { P } from "./text";
import { ContrastArea } from "./themes";
import { ts } from "./utils";

const MenuContext = createContext<((open: boolean) => void) | undefined>(undefined);

const Menu = <AsProps extends { onPress: PressableProps["onPress"] }>({
	Triger,
	onMenuOpen,
	onMenuClose,
	children,
	...props
}: {
	Triger: ComponentType<AsProps>;
	children: ReactNode | ReactNode[] | null;
	onMenuOpen: () => void;
	onMenuClose: () => void;
} & Omit<AsProps, "onPress">) => {
	const [isOpen, setOpen] = useState(false);

	useEffect(() => {
		if (isOpen) onMenuOpen?.call(null);
		else onMenuClose?.call(null);
	}, [isOpen, onMenuClose, onMenuOpen]);

	return (
		<>
			{/* @ts-ignore */}
			<Triger onPress={() => setOpen(true)} {...props} />
			{isOpen && (
				<Portal>
					<ContrastArea mode="user">
						{({ css, theme }) => (
							<MenuContext.Provider value={setOpen}>
								<Pressable
									onPress={() => setOpen(false)}
									focusable={false}
									{...css({ ...StyleSheet.absoluteFillObject, flexGrow: 1, bg: "transparent" })}
								/>
								<ScrollView
									{...css([
										{
											bg: (theme) => theme.background,
											position: "absolute",
											bottom: 0,
											width: percent(100),
											alignSelf: "center",
											borderTopLeftRadius: px(26),
											borderTopRightRadius: { xs: px(26), xl: 0 },
											paddingTop: { xs: px(26), xl: 0 },
											marginTop: { xs: px(72), xl: 0 },
										},
										sm({
											maxWidth: px(640),
											marginHorizontal: px(56),
										}),
										xl({
											top: 0,
											right: 0,
											marginRight: 0,
											borderBottomLeftRadius: px(26),
										}),
									])}
								>
									<IconButton
										icon={Close}
										color={theme.colors.black}
										onPress={() => setOpen(false)}
										{...css({ alignSelf: "flex-end", display: { xs: "none", xl: "flex" } })}
									/>
									{children}
								</ScrollView>
							</MenuContext.Provider>
						)}
					</ContrastArea>
				</Portal>
			)}
		</>
	);
};

const MenuItem = <AsProps extends PressableProps>({
	label,
	icon,
	selected,
	as,
	onPress,
	...props
}: {
	label: string;
	icon?: JSX.Element;
	selected?: boolean;
	as?: ComponentType<AsProps>;
} & AsProps) => {
	const { css } = useYoshiki();
	const setOpen = useContext(MenuContext);

	const As: ComponentType<any> = as ?? PressableFeedback;
	return (
		<As
			onPress={(e: any) => {
				setOpen?.call(null, false);
				onPress?.call(null, e);
			}}
			{...css(
				{ paddingHorizontal: ts(2), width: percent(100), height: ts(5), justifyContent: "center" },
				props as any,
			)}
		>
			{icon ?? null}
			<P>{label}</P>
		</As>
	);
};
Menu.Item = MenuItem;

export { Menu };
