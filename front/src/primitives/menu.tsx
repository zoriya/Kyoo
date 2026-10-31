import Check from "@material-symbols/svg-400/rounded/check-fill.svg";
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
import { Pressable, ScrollView } from "react-native";
import Animated from "react-native-reanimated";
import type { SvgProps } from "react-native-svg";
import { Portal } from "react-native-teleport";
import { useResolveClassNames } from "uniwind";
import { cn } from "~/utils";
import { FocusTrap } from "./focus";
import { Icon } from "./icons";
import { PressableFeedback } from "./links";
import { P } from "./text";

const MenuContext = createContext<
	| {
			close: () => void;
			openSub: (
				children?: ReactNode | ReactNode[] | null | (() => ReactNode),
			) => void;
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
			/>
			{isOpen && (
				<Portal hostName="root">
					<MenuSheet close={() => setOpen(false)}>{children}</MenuSheet>
				</Portal>
			)}
		</>
	);
};

const MenuSheet = ({
	close,
	children,
}: {
	close: () => void;
	children?: ReactNode | ReactNode[] | null | (() => ReactNode);
}) => {
	const [sub, setSub] = useState<{
		children?: ReactNode | ReactNode[] | null | (() => ReactNode);
	} | null>(null);

	// above xl the menu is a full height side panel that slides from the right,
	const isPanel = useResolveClassNames("xl:top-0").top !== undefined;
	const [shown, setShown] = useState(false);
	useEffect(() => {
		setShown(true);
	}, []);

	return (
		<MenuContext.Provider
			value={{ close, openSub: (children) => setSub({ children }) }}
		>
			<Pressable
				onPress={close}
				tabIndex={-1}
				className="absolute inset-0 flex-1 bg-transparent"
			/>
			<Animated.View
				className={cn(
					"absolute bottom-0 w-full self-center bg-popover px-safe pb-safe sm:mx-safe-or-12 sm:max-w-2xl sm:px-0",
					"mt-20 max-h-[80vh] rounded-t-4xl pt-8",
					"xl:top-0 xl:right-0 xl:mt-0 xl:mr-0 xl:max-h-screen xl:max-w-xl xl:rounded-l-4xl xl:rounded-tr-none xl:pt-safe-offset-10 xl:pr-safe",
				)}
				style={{
					transform: [
						isPanel
							? { translateX: shown ? "0%" : "100%" }
							: { translateY: shown && !sub ? "0%" : "100%" },
					],
					transitionProperty: "transform",
					transitionDuration: "200ms",
					transitionTimingFunction: "ease-out",
				}}
			>
				<FocusTrap onBack={close} className="shrink">
					<ScrollView snapToAlignment="item">
						{typeof children === "function" ? children() : children}
					</ScrollView>
				</FocusTrap>
			</Animated.View>
			{sub && <MenuSheet close={close}>{sub.children}</MenuSheet>}
		</MenuContext.Provider>
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

	const icn = (icon || selected) && (
		<Icon
			icon={icon ?? Check}
			className={cn(
				"group-highlighted:fill-slate-200",
				disabled && "fill-slate-600 dark:fill-slate-600",
			)}
		/>
	);

	return (
		<PressableFeedback
			onPress={() => {
				if (closeOnSelect) menu?.close();
				onSelect?.call(null);
				if (href) router.push(href);
			}}
			disabled={disabled}
			hasTVPreferredFocus={selected}
			scrollSnapAlign="center"
			// same highlight as the web menu, where radix sets the attribute itself
			className="group h-15 w-full flex-row items-center gap-4 px-4 highlighted:bg-accent"
			{...props}
		>
			{left && left}
			{!left && icn}
			<P
				className={cn(
					"flex-1 group-highlighted:text-slate-200",
					// keep labels aligned with the ones that have an icon (size-6 + gap-4)
					!(icon || selected || left) && "pl-10",
					disabled && "text-slate-600",
				)}
			>
				{label}
			</P>
			{left && icn}
		</PressableFeedback>
	);
};
Menu.Item = MenuItem;

const Sub = ({
	children,
	...props
}: {
	label: string;
	selected?: boolean;
	left?: ReactElement;
	disabled?: boolean;
	icon?: ComponentType<SvgProps>;
	children?: ReactNode | ReactNode[] | null | (() => ReactNode);
}) => {
	const menu = useContext(MenuContext);
	return (
		<MenuItem
			closeOnSelect={false}
			onSelect={() => menu?.openSub(children)}
			{...props}
		/>
	);
};
Menu.Sub = Sub;

export { Menu };
