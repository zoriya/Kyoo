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

import Dot from "@material-symbols/svg-400/rounded/fiber_manual_record-fill.svg";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import {
	type ComponentProps,
	type ComponentType,
	type ReactElement,
	type ReactNode,
	forwardRef,
} from "react";
import type { PressableProps } from "react-native";
import type { SvgProps } from "react-native-svg";
import { useYoshiki as useNativeYoshiki } from "yoshiki/native";
import { useYoshiki } from "yoshiki/web";
import { Icon } from "./icons";
import { P } from "./text";
import { ContrastArea, SwitchVariant } from "./themes";
import { focusReset, ts } from "./utils";

type YoshikiFunc<T> = (props: ReturnType<typeof useYoshiki>) => T;
export const YoshikiProvider = ({ children }: { children: YoshikiFunc<ReactNode> }) => {
	const yoshiki = useYoshiki();
	return <>{children(yoshiki)}</>;
};
export const InternalTriger = forwardRef<unknown, any>(function _Triger(
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
	isOpen,
	setOpen,
	...props
}: {
	Trigger: ComponentType<AsProps>;
	children: ReactNode | ReactNode[] | null;
	onMenuOpen?: () => void;
	onMenuClose?: () => void;
	isOpen?: boolean;
	setOpen?: (v: boolean) => void;
} & Omit<AsProps, "onPress">) => {
	return (
		<DropdownMenu.Root
			modal
			open={isOpen}
			onOpenChange={(newOpen) => {
				if (setOpen) setOpen(newOpen);
				if (newOpen) onMenuOpen?.call(null);
				else onMenuClose?.call(null);
			}}
		>
			<DropdownMenu.Trigger asChild>
				<InternalTriger Component={Trigger} ComponentProps={props} />
			</DropdownMenu.Trigger>
			<ContrastArea mode="user">
				<SwitchVariant>
					<YoshikiProvider>
						{({ css, theme }) => (
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
									<DropdownMenu.Arrow fill={theme.background} />
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
>(function _Item({ children, href, onSelect, ...props }, ref) {
	if (href) {
		return (
			<DropdownMenu.Item ref={ref} onSelect={onSelect} {...props} asChild>
				<Link href={href} style={{ textDecoration: "none" }}>
					{children}
				</Link>
			</DropdownMenu.Item>
		);
	}
	return (
		<DropdownMenu.Item ref={ref} onSelect={onSelect} {...props}>
			{children}
		</DropdownMenu.Item>
	);
});

const MenuItem = forwardRef<
	HTMLDivElement,
	{
		label: string;
		icon?: ComponentType<SvgProps>;
		left?: ReactElement;
		disabled?: boolean;
		selected?: boolean;
	} & ({ onSelect: () => void; href?: undefined } | { href: string; onSelect?: undefined })
>(function MenuItem({ label, icon, left, selected, onSelect, href, disabled, ...props }, ref) {
	const { css: nCss } = useNativeYoshiki();
	const { css, theme } = useYoshiki();

	const icn = (icon || selected) && (
		<Icon
			icon={icon ?? Dot}
			color={disabled ? theme.overlay0 : theme.paragraph}
			size={icon ? 24 : ts(1)}
			{...nCss({ paddingX: ts(1) })}
		/>
	);

	return (
		<>
			<style jsx global>{`
				[data-highlighted] {
					background: ${theme.variant.accent};
					svg {
						fill: ${theme.alternate.contrast};
					}
					div {
						color: ${theme.alternate.contrast};
					}
				}
			`}</style>
			<Item
				ref={ref}
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
				<P
					{...nCss([
						{ paddingLeft: 8 * 2 + +!(icon || selected || left) * 24, flexGrow: 1 },
						disabled && {
							color: theme.overlay0,
						},
					])}
				>
					{label}
				</P>

				{left && icn && icn}
			</Item>
		</>
	);
});
Menu.Item = MenuItem;

const Sub = <AsProps,>({
	children,
	disabled,
	...props
}: {
	label: string;
	selected?: boolean;
	left?: ReactElement;
	disabled?: boolean;
	icon?: ComponentType<SvgProps>;
	children: ReactNode | ReactNode[] | null;
} & AsProps) => {
	const { css, theme } = useYoshiki();

	return (
		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger asChild disabled={disabled}>
				<MenuItem disabled={disabled} {...props} onSelect={(e?: any) => e.preventDefault()} />
			</DropdownMenu.SubTrigger>
			<DropdownMenu.Portal>
				<DropdownMenu.SubContent
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
					<DropdownMenu.Arrow fill={theme.background} />
				</DropdownMenu.SubContent>
			</DropdownMenu.Portal>
		</DropdownMenu.Sub>
	);
};
Menu.Sub = Sub;

export { Menu };
