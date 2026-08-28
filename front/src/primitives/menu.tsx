import Check from "@material-symbols/svg-400/rounded/check-fill.svg";
import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import { useRouter } from "expo-router";
import {
	type ComponentType,
	createContext,
	type ReactElement,
	type ReactNode,
	useContext,
	useEffect,
	useEffectEvent,
	useRef,
	useState,
} from "react";
import { BackHandler, Pressable, ScrollView, type View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { Portal } from "react-native-teleport";
import { cn } from "~/utils";
import { FocusGroup, preferFocus, requestFocus } from "./focus";
import { Icon, IconButton } from "./icons";
import { PressableFeedback } from "./links";
import { P } from "./text";

const MenuContext = createContext<
	| {
			setOpen: (open: boolean) => void;
			// Items number themselves as they render so the first one can ask for the
			// focus: `hasTVPreferredFocus` is the only thing that takes it inside a
			// portal, and it has to be on a real item, not on the sheet around them.
			// The counter is rebuilt at every render of the menu, so it counts the
			// same way every time.
			nextIndex: () => number;
	  }
	| undefined
>(undefined);

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
	children?: ReactNode | ReactNode[] | null | (() => ReactNode);
	onMenuOpen?: () => void;
	onMenuClose?: () => void;
	isOpen?: boolean;
	setOpen?: (v: boolean) => void;
} & Optional<AsProps, "onPress">) => {
	const alreadyRendered = useRef(false);
	const trigger = useRef<View | null>(null);
	const [innerOpen, innerSetOpen] = useState(false);
	const controlled = outerOpen !== undefined && outerSetOpen !== undefined;
	const isOpen = controlled ? outerOpen : innerOpen;
	const setOpen = controlled ? outerSetOpen : innerSetOpen;

	const onOpen = useEffectEvent(() => {
		onMenuOpen?.();
	});
	const onClose = useEffectEvent(() => {
		onMenuClose?.();
	});
	useEffect(() => {
		if (isOpen) onOpen();
		else if (alreadyRendered.current) onClose?.();
		alreadyRendered.current = true;
	}, [isOpen]);

	// The trap can only go up once the focus is already inside: a focus guide that
	// traps a direction also refuses to let the focus in through it.
	const [trapped, setTrapped] = useState(false);
	// rebuilt at every render so the items always number themselves the same way
	let index = 0;
	useEffect(() => {
		if (!isOpen) {
			setTrapped(false);
			// the sheet took the focus with it on the way out
			if (alreadyRendered.current) requestFocus(trigger.current);
			return;
		}
		setTrapped(true);
		// and the back button has to dismiss the menu rather than the screen.
		const back = BackHandler.addEventListener("hardwareBackPress", () => {
			setOpen(false);
			return true;
		});
		return () => back.remove();
	}, [isOpen, setOpen]);

	return (
		<>
			<Trigger
				// need to use onPressIn due to:
				//  https://github.com/react-navigation/react-navigation/issues/12274
				//  https://github.com/react-navigation/react-navigation/issues/12667
				onPressIn={() => {
					setOpen(true);
				}}
				{...(props as AsProps)}
				// after whatever the caller has to say about it (`preferFocus` hands out
				// a ref of its own), because closing the menu has to put the selection
				// back on the trigger.
				ref={(view: View | null) => {
					trigger.current = view;
					(props as { ref?: (v: View | null) => void }).ref?.(view);
				}}
			/>
			{isOpen && (
				<Portal hostName="root">
					<MenuContext.Provider value={{ setOpen, nextIndex: () => index++ }}>
						<Pressable
							onPress={() => setOpen(false)}
							tabIndex={-1}
							className="absolute inset-0 flex-1 bg-transparent"
						/>
						<FocusGroup
							// an open menu is the only thing a remote can reach
							trapFocusUp={trapped}
							trapFocusDown={trapped}
							trapFocusLeft={trapped}
							trapFocusRight={trapped}
							className={cn(
								"absolute bottom-0 w-full self-center bg-popover px-safe pb-safe sm:mx-12 sm:max-w-2xl",
								"mt-20 max-h-[80vh] rounded-t-4xl pt-8",
								"xl:top-0 xl:right-0 xl:mr-0 xl:rounded-l-4xl xl:rounded-tr-0 xl:pt-safe",
							)}
						>
							<ScrollView className="native:max-h-[80vh]">
								<IconButton
									icon={Close}
									onPress={() => setOpen(false)}
									className="hidden self-end xl:flex"
								/>
								{typeof children === "function" ? children() : children}
							</ScrollView>
						</FocusGroup>
					</MenuContext.Provider>
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
	closeOnSelect = true,
	...props
}: {
	label: string;
	selected?: boolean;
	left?: ReactElement;
	disabled?: boolean;
	closeOnSelect?: boolean;
	icon?: ComponentType<SvgProps>;
} & (
	| { onSelect: () => void; href?: undefined; download?: undefined }
	| { href: string; download?: boolean; onSelect?: undefined }
)) => {
	const menu = useContext(MenuContext);
	const router = useRouter();
	const index = menu?.nextIndex() ?? 1;

	const icn = (highlighted: true | undefined) =>
		(icon || selected) && (
			<Icon
				icon={icon ?? Check}
				data-highlighted={highlighted}
				className={cn(
					"mx-6 data-highlighted:fill-slate-200",
					disabled && "fill-slate-600 dark:fill-slate-600",
				)}
			/>
		);

	return (
		<PressableFeedback
			onPress={() => {
				if (closeOnSelect) menu?.setOpen(false);
				onSelect?.call(null);
				if (href) router.push(href);
			}}
			disabled={disabled}
			// same highlight as the web menu, where radix sets the attribute itself
			className="h-15 w-full flex-row items-center highlighted:bg-accent px-4"
			{...preferFocus(index === 0)}
			{...props}
		>
			{({ focused, hovered }) => {
				const highlighted = focused || hovered || undefined;
				return (
					<>
						{left && left}
						{!left && icn(highlighted)}
						<P
							data-highlighted={highlighted}
							className={cn(
								"flex-1 data-highlighted:text-slate-200",
								disabled && "text-slate-600",
							)}
							style={{
								paddingLeft: 8 * 2 + +!(icon || selected || left) * 24,
							}}
						>
							{label}
						</P>
						{left && icn(highlighted)}
					</>
				);
			}}
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
	children?: ReactNode | ReactNode[] | null | (() => ReactNode);
} & AsProps) => {
	const menu = useContext(MenuContext);
	return (
		<Menu
			Trigger={MenuItem}
			onMenuClose={() => menu?.setOpen(false)}
			{...props}
		>
			{children}
		</Menu>
	);
};
Menu.Sub = Sub;

export { Menu };
