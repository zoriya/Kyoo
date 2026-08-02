import Dot from "@material-symbols/svg-400/rounded/fiber_manual_record-fill.svg";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
	type ComponentType,
	forwardRef,
	type ReactElement,
	type ReactNode,
	useState,
} from "react";
import type { GestureResponderEvent, PressableProps } from "react-native";
import type { SvgProps } from "react-native-svg";
import { cn } from "~/utils";
import { Icon } from "./icons";
import { useLinkTo } from "./links";
import { P } from "./text";

export const InternalTrigger = forwardRef<unknown, any>(function _Triger(
	{ Component, ComponentProps, ...props },
	ref,
) {
	return (
		<Component
			ref={ref}
			{...ComponentProps}
			{...props}
			onClickCapture={props.onPointerDown}
			onPress={props.onPress ?? props.onClick}
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
	children: ReactNode | ReactNode[] | null | (() => ReactNode);
	onMenuOpen?: () => void;
	onMenuClose?: () => void;
	isOpen?: boolean;
	setOpen?: (v: boolean) => void;
} & Omit<AsProps, "onPress">) => {
	const controlled = isOpen !== undefined;
	const [innerOpen, setInnerOpen] = useState(false);
	const open = controlled ? isOpen : innerOpen;

	const setOpenState = (v: boolean) => {
		if (controlled) setOpen?.(v);
		else setInnerOpen(v);
	};

	// radix is heavy on setup, it mounts a `Root` (even closed) + setup events
	// lazy loading it is a real perf gain
	const [mounted, setMounted] = useState(!!open);
	if (open && !mounted) setMounted(true);
	if (!mounted) {
		return (
			<InternalTrigger
				Component={Trigger}
				{...props}
				onPress={(e: GestureResponderEvent) => {
					e.preventDefault();
					e.stopPropagation();
					setOpenState(true);
					onMenuOpen?.call(null);
				}}
			/>
		);
	}

	return (
		<DropdownMenu.Root
			modal
			open={open}
			onOpenChange={(newOpen) => {
				setOpenState(newOpen);
				if (newOpen) onMenuOpen?.call(null);
				else onMenuClose?.call(null);
			}}
		>
			<DropdownMenu.Trigger asChild>
				<InternalTrigger Component={Trigger} {...props} />
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					onFocusOutside={(e) => e.stopImmediatePropagation()}
					className="z-10 min-w-2xs overflow-y-auto rounded bg-popover shadow-xl"
					style={{
						maxHeight:
							"calc(var(--radix-dropdown-menu-content-available-height) * 0.8)",
					}}
				>
					{typeof children === "function" ? children() : children}
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
		closeOnSelect?: boolean;
		className?: string;
	} & (
		| { onSelect: () => void; href?: undefined; download?: undefined }
		| { href: string; download?: boolean; onSelect?: undefined }
	)
>(function MenuItem(
	{
		label,
		icon,
		left,
		selected,
		onSelect,
		href,
		download,
		disabled,
		closeOnSelect = true,
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

	let content = (
		<>
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
		</>
	);

	let { onPress, ...linkProps } = useLinkTo({ href });

	if (href && download) {
		content = (
			<a href={href} download className="flew-row flex items-center">
				{content}
			</a>
		);
		onPress = undefined;
		linkProps = {};
	}

	return (
		<DropdownMenu.Item
			ref={ref}
			{...linkProps}
			onSelect={(e) => {
				if (!closeOnSelect) e.preventDefault();
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
			{content}
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
	children: ReactNode | ReactNode[] | null | (() => ReactNode);
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
					{typeof children === "function" ? children() : children}
					<DropdownMenu.Arrow className="fill-popover" />
				</DropdownMenu.SubContent>
			</DropdownMenu.Portal>
		</DropdownMenu.Sub>
	);
};
Menu.Sub = Sub;

export { Menu };
