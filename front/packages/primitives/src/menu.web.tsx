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

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ComponentProps, ComponentType, forwardRef, ReactElement, ReactNode } from "react";
import Link from "next/link";
import { PressableProps } from "react-native";
import { useYoshiki } from "yoshiki/web";
import { useYoshiki as useNativeYoshiki } from "yoshiki/native";
import { P } from "./text";
import { ContrastArea, SwitchVariant } from "./themes";
import { Icon } from "./icons";
import Dot from "@material-symbols/svg-400/rounded/fiber_manual_record-fill.svg";
import { focusReset, ts } from "./utils";
import { SvgProps } from "react-native-svg";

type YoshikiFunc<T> = (props: ReturnType<typeof useYoshiki>) => T;
const YoshikiProvider = ({ children }: { children: YoshikiFunc<ReactNode> }) => {
	const yoshiki = useYoshiki();
	return <>{children(yoshiki)}</>;
};
const InternalTriger = forwardRef<unknown, any>(function _Triger(
	{ Component, ComponentProps, ...props },
	ref,
) {
	return (
		<Component ref={ref} {...ComponentProps} {...props} onClickCapture={props.onPointerDown} />
	);
});

const Menu = <AsProps extends { onPress: PressableProps["onPress"] }>({
	Trigger,
	onMenuOpen,
	onMenuClose,
	children,
	...props
}: {
	Trigger: ComponentType<AsProps>;
	children: ReactNode | ReactNode[] | null;
	onMenuOpen?: () => void;
	onMenuClose?: () => void;
} & Omit<AsProps, "onPress">) => {
	return (
		<DropdownMenu.Root
			modal
			onOpenChange={(isOpen) => {
				if (isOpen) onMenuOpen?.call(null);
				else onMenuClose?.call(null);
			}}
		>
			<DropdownMenu.Trigger asChild>
				<InternalTriger Component={Trigger} ComponentProps={props} />
			</DropdownMenu.Trigger>
			<ContrastArea mode="user">
				<SwitchVariant>
					<YoshikiProvider>
						{({ css }) => (
							<DropdownMenu.Portal>
								<DropdownMenu.Content
									onFocusOutside={(e) => e.stopImmediatePropagation()}
									{...css({
										bg: (theme) => theme.background,
										overflow: "auto",
										minWidth: "220px",
										borderRadius: "8px",
										boxShadow:
											"0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)",
										zIndex: 2,
										maxHeight: "calc(var(--radix-dropdown-menu-content-available-height) * 0.8)",
									})}
								>
									{children}
								</DropdownMenu.Content>
							</DropdownMenu.Portal>
						)}
					</YoshikiProvider>
				</SwitchVariant>
			</ContrastArea>
		</DropdownMenu.Root>
	);
};

const Item = forwardRef<
	HTMLDivElement,
	ComponentProps<typeof DropdownMenu.Item> & { href?: string }
>(function _Item({ children, href, ...props }, ref) {
	if (href) {
		return (
			<DropdownMenu.Item ref={ref} {...props} asChild>
				<Link href={href} style={{ textDecoration: "none" }}>
					{children}
				</Link>
			</DropdownMenu.Item>
		);
	}
	return (
		<DropdownMenu.Item ref={ref} {...props}>
			{children}
		</DropdownMenu.Item>
	);
});

const MenuItem = ({
	label,
	icon,
	left,
	selected,
	onSelect,
	href,
	disabled,
	...props
}: {
	label: string;
	icon?: ComponentType<SvgProps>;
	left?: ReactElement;
	disabled?: boolean;
	selected?: boolean;
} & ({ onSelect: () => void; href?: undefined } | { href: string; onSelect?: undefined })) => {
	const { css: nCss } = useNativeYoshiki();
	const { css, theme } = useYoshiki();

	const icn = (icon || selected) && (
		<Icon
			icon={icon ?? Dot}
			color={disabled ? theme.overlay0 : theme.paragraph}
			size={ts(icon ? 2 : 1)}
			{...nCss({ paddingRight: ts(1) })}
		/>
	);

	return (
		<>
			<style jsx global>{`
				[data-highlighted] {
					background: ${theme.variant.accent};
				}
			`}</style>
			<Item
				onSelect={onSelect}
				href={href}
				disabled={disabled}
				{...css(
					{
						display: "flex",
						alignItems: "center",
						padding: "8px",
						height: "32px",
						...focusReset,
					},
					props as any,
				)}
			>
				{left && left}
				{!left && icn && icn}
				{
					<P
						{...nCss([
							{
								paddingLeft: ts(icon || selected || left ? 0 : 2 + +!!icon),
								flexGrow: 1,
							},
							disabled && {
								color: theme.overlay0,
							},
						])}
					>
						{label}
					</P>
				}
				{left && icn && icn}
			</Item>
		</>
	);
};
Menu.Item = MenuItem;

export { Menu };
