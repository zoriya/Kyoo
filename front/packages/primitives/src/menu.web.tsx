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
import { ComponentType, forwardRef, ReactNode } from "react";
import { PressableProps } from "react-native";
import { useYoshiki } from "yoshiki/web";
import { px, useYoshiki as useNativeYoshiki } from "yoshiki/native";
import { P } from "./text";
import { ContrastArea } from "./themes";
import { Icon } from "./icons";
import Dot from "@material-symbols/svg-400/rounded/fiber_manual_record-fill.svg";
import { focusReset } from "./utils";

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
	return (
		<DropdownMenu.Root
			modal
			onOpenChange={(isOpen) => {
				if (isOpen) onMenuOpen?.call(null);
				else onMenuClose?.call(null);
			}}
		>
			<DropdownMenu.Trigger asChild>
				<InternalTriger Component={Triger} ComponentProps={props} />
			</DropdownMenu.Trigger>
			<ContrastArea mode="user">
				<YoshikiProvider>
					{({ css }) => (
						<DropdownMenu.Portal>
							<DropdownMenu.Content
								onFocusOutside={(e) => e.stopImmediatePropagation()}
								{...css({
									bg: (theme) => theme.background,
									overflow: "hidden",
									minWidth: "220px",
									borderRadius: "8px",
									boxShadow:
										"0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)",
								})}
							>
								{children}
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					)}
				</YoshikiProvider>
			</ContrastArea>
		</DropdownMenu.Root>
	);
};

const MenuItem = ({
	label,
	icon,
	selected,
	onSelect,
	...props
}: {
	label: string;
	icon?: JSX.Element;
	selected?: boolean;
	onSelect: () => void;
}) => {
	const { css: nCss } = useNativeYoshiki();
	const { css, theme } = useYoshiki();

	return (
		<>
			<style jsx global>{`
				[data-highlighted] {
					background: ${theme.alternate.accent};
				}
			`}</style>
			<DropdownMenu.Item
				onSelect={onSelect}
				{...css(
					{
						display: "flex",
						alignItems: "center",
						padding: "8px",
						height: "32px",
						color: (theme) => theme.paragraph,
						focus: {
							self: focusReset,
						},
					},
					props as any,
				)}
			>
				{selected && (
					<Icon
						icon={Dot}
						color={theme.paragraph}
						size={px(8)}
						{...nCss({ paddingRight: px(8) })}
					/>
				)}
				{<P {...nCss([{ color: "inherit" }, !selected && { paddingLeft: px(8 * 2) }])}>{label}</P>}
			</DropdownMenu.Item>
		</>
	);
};
Menu.Item = MenuItem;

export { Menu };
