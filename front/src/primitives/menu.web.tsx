import Dot from "@material-symbols/svg-400/rounded/fiber_manual_record-fill.svg";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
	type ComponentType,
	forwardRef,
	type ReactElement,
	type ReactNode,
} from "react";
import type { PressableProps } from "react-native";
import type { SvgProps } from "react-native-svg";
import { cn } from "~/utils";
import { Icon } from "./icons";
import { useLinkTo } from "./links";
import { P } from "./text";

export const InternalTriger = forwardRef<unknown, any>(function _Triger(
	{ Component, ComponentProps, ...props },
	ref,
) {
	return (
		<Component
			ref={ref}
			{...ComponentProps}
			{...props}
			onClickCapture={props.onPointerDown}
		/>
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
				<InternalTriger Component={Trigger} {...props} />
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					onFocusOutside={(e) => e.stopImmediatePropagation()}
					className="z-10 min-w-2xs overflow-hidden rounded bg-popover shadow-xl"
					style={{
						maxHeight:
							"calc(var(--radix-dropdown-menu-content-available-height) * 0.8)",
					}}
				>
					{children}
					<DropdownMenu.Arrow className="fill-popover" />
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
};

const MenuItem = forwardRef<
	HTMLDivElement,
	{
		label: string;
		icon?: ComponentType<SvgProps>;
		left?: ReactElement;
		disabled?: boolean;
		selected?: boolean;
		className?: string;
	} & (
		| { onSelect: () => void; href?: undefined }
		| { href: string; onSelect?: undefined }
	)
>(function MenuItem(
	{
		label,
		icon,
		left,
		selected,
		onSelect,
		href,
		disabled,
		className,
		...props
	},
	ref,
) {
	const icn = (icon || selected) && (
		<Icon
			icon={icon ?? Dot}
			className={cn(
				"mx-2 group-data-highlighted:fill-slate-200",
				disabled && "fill-slate-600 dark:fill-slate-600",
				!icon && "h-2 w-2",
			)}
		/>
	);

	const { onPress, ...linkProps } = useLinkTo({ href });

	return (
		<DropdownMenu.Item
			ref={ref}
			{...linkProps}
			onSelect={() => {
				onSelect?.();
				onPress?.(undefined!);
			}}
			disabled={disabled}
			className={cn(
				"group flex h-10 flex-row items-center p-2 py-6 outline-0 data-highlighted:bg-accent",
				className,
			)}
			{...props}
		>
			{left && left}
			{!left && icn}
			<P
				className={cn(
					"flex-1 group-data-highlighted:text-slate-200",
					disabled && "text-slate-600",
				)}
				style={{
					paddingLeft: 8 * 2 + +!(icon || selected || left) * 24,
				}}
			>
				{label}
			</P>

			{left && icn}
		</DropdownMenu.Item>
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
	return (
		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger asChild disabled={disabled}>
				<MenuItem
					disabled={disabled}
					{...props}
					onSelect={(e?: any) => e.preventDefault()}
				/>
			</DropdownMenu.SubTrigger>
			<DropdownMenu.Portal>
				<DropdownMenu.SubContent
					onFocusOutside={(e) => e.stopImmediatePropagation()}
					className="z-10 min-w-2xs overflow-hidden rounded bg-popover shadow-xl"
					style={{
						maxHeight:
							"calc(var(--radix-dropdown-menu-content-available-height) * 0.8)",
					}}
				>
					{children}
					<DropdownMenu.Arrow className="fill-popover" />
				</DropdownMenu.SubContent>
			</DropdownMenu.Portal>
		</DropdownMenu.Sub>
	);
};
Menu.Sub = Sub;

export { Menu };
