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
import {
	ComponentType,
	createContext,
	ReactElement,
	ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { percent, px, sm, useYoshiki, vh, xl } from "yoshiki/native";
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

type Optional<T, K extends keyof any> = Omit<T, K> & Partial<T>;

const Menu = <AsProps,>({
	Trigger,
	onMenuOpen,
	onMenuClose,
	children,
	isOpen: outerOpen,
	setOpen: outerSetOpen,
	...props
}: {
	Trigger: ComponentType<AsProps>;
	children?: ReactNode | ReactNode[] | null;
	onMenuOpen?: () => void;
	onMenuClose?: () => void;
	isOpen?: boolean;
	setOpen?: (v: boolean) => void;
} & Optional<AsProps, "onPress">) => {
	const insets = useSafeAreaInsets();
	const alreadyRendered = useRef(false);
	const [isOpen, setOpen] =
		outerOpen !== undefined && outerSetOpen ? [outerOpen, outerSetOpen] : useState(false);

	// deos the same as a useMemo but for props.
	const memoRef = useRef({ onMenuOpen, onMenuClose });
	memoRef.current = { onMenuOpen, onMenuClose };
	useEffect(() => {
		if (isOpen) memoRef.current.onMenuOpen?.();
		else if (alreadyRendered.current) memoRef.current.onMenuClose?.();
		alreadyRendered.current = true;
	}, [isOpen]);

	return (
		<>
			<Trigger
				onPress={() => {
					setOpen(true);
				}}
				{...(props as any)}
			/>
			{isOpen && (
				<Portal>
					<ContrastArea mode="user">
						<SwitchVariant>
							{({ css, theme }) => (
								<MenuContext.Provider value={setOpen}>
									<Pressable
										onPress={() => setOpen(false)}
										tabIndex={-1}
										{...css({ ...StyleSheet.absoluteFillObject, flexGrow: 1, bg: "transparent" })}
									/>
									<View
										{...css([
											{
												bg: (theme) => theme.background,
												position: "absolute",
												bottom: 0,
												width: percent(100),
												maxHeight: vh(80),
												alignSelf: "center",
												borderTopLeftRadius: px(26),
												borderTopRightRadius: { xs: px(26), xl: 0 },
												paddingTop: { xs: px(26), xl: 0 },
												marginTop: { xs: px(72), xl: 0 },
												paddingBottom: insets.bottom,
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
										<ScrollView>
											<IconButton
												icon={Close}
												color={theme.colors.black}
												onPress={() => setOpen(false)}
												{...css({ alignSelf: "flex-end", display: { xs: "none", xl: "flex" } })}
											/>
											{children}
										</ScrollView>
									</View>
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
	disabled,
	...props
}: {
	label: string;
	selected?: boolean;
	left?: ReactElement;
	disabled?: boolean;
	icon?: ComponentType<SvgProps>;
} & ({ onSelect: () => void; href?: undefined } | { href: string; onSelect?: undefined })) => {
	const { css, theme } = useYoshiki();
	const setOpen = useContext(MenuContext);
	const router = useRouter();

	const icn = (icon || selected) && (
		<Icon
			icon={icon ?? Check}
			color={disabled ? theme.overlay0 : theme.paragraph}
			size={24}
			{...css({ paddingX: ts(1) })}
		/>
	);

	return (
		<PressableFeedback
			onPress={() => {
				setOpen?.call(null, false);
				onSelect?.call(null);
				if (href) router.push(href);
			}}
			disabled={disabled}
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
			<P
				{...css([
					{ paddingLeft: ts(2) + +!(icon || selected || left) * px(24), flexGrow: 1 },
					disabled && { color: theme.overlay0 },
				])}
			>
				{label}
			</P>
			{left && icn && icn}
		</PressableFeedback>
	);
};
Menu.Item = MenuItem;

const Sub = <AsProps,>({
	children,
	...props
}: {
	label: string;
	selected?: boolean;
	left?: ReactElement;
	disabled?: boolean;
	icon?: ComponentType<SvgProps>;
	children?: ReactNode | ReactNode[] | null;
} & AsProps) => {
	const setOpen = useContext(MenuContext);
	return (
		<Menu Trigger={MenuItem} onMenuClose={() => setOpen?.(false)} {...props}>
			{children}
		</Menu>
	);
};
Menu.Sub = Sub;

export { Menu };
