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
import { ComponentType, createContext, ReactElement, ReactNode, useContext, useEffect, useState } from "react";
import { StyleSheet, Pressable } from "react-native";
import { percent, px, sm, useYoshiki, xl } from "yoshiki/native";
import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import { Icon, IconButton } from "./icons";
import { PressableFeedback } from "./links";
import { P } from "./text";
import { ContrastArea, SwitchVariant } from "./themes";
import { ts } from "./utils";
import Check from "@material-symbols/svg-400/rounded/check-fill.svg";
import { useRouter } from "solito/router";
import { SvgProps } from "react-native-svg";

const MenuContext = createContext<((open: boolean) => void) | undefined>(undefined);

const Menu = <AsProps,>({
	Trigger,
	onMenuOpen,
	onMenuClose,
	children,
	...props
}: {
	Trigger: ComponentType<AsProps>;
	children?: ReactNode | ReactNode[] | null;
	onMenuOpen?: () => void;
	onMenuClose?: () => void;
} & Omit<AsProps, "onPress">) => {
	const [isOpen, setOpen] = useState(false);

	useEffect(() => {
		if (isOpen) onMenuOpen?.call(null);
		else onMenuClose?.call(null);
	}, [isOpen, onMenuClose, onMenuOpen]);

	return (
		<>
			<Trigger onPress={() => setOpen(true)} {...props as any} />
			{isOpen && (
				<Portal>
					<ContrastArea mode="user">
						<SwitchVariant>
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
						</SwitchVariant>
					</ContrastArea>
				</Portal>
			)}
		</>
	);
};

const MenuItem = ({
	label,
	selected,
	left,
	onSelect,
	href,
	icon,
	...props
}: {
	label: string;
	selected?: boolean;
	left?: ReactElement;
	icon?: ComponentType<SvgProps>;
} & ({ onSelect: () => void; href?: undefined } | { href: string; onSelect?: undefined })) => {
	const { css, theme } = useYoshiki();
	const setOpen = useContext(MenuContext);
	const router = useRouter();

	const icn = (icon || selected) && <Icon icon={icon ?? Check} color={theme.paragraph} size={24} {...css({ paddingLeft: icon ? ts(2) : 0 })}/>;

	return (
		<PressableFeedback
			onPress={() => {
				setOpen?.call(null, false);
				onSelect?.call(null);
				if (href) router.push(href);
			}}
			{...css(
				{
					paddingHorizontal: ts(2),
					width: percent(100),
					height: ts(5),
					alignItems: "center",
					flexDirection: "row",
				},
				props as any,
			)}
		>
			{left && left}
			{!left && icn && icn}
			<P {...css({ paddingLeft: ts(2) + +!(icon || selected || left) * px(24), flexGrow: 1 })}>{label}</P>
			{left && icn && icn}
		</PressableFeedback>
	);
};
Menu.Item = MenuItem;

export { Menu };
