import { Portal } from "@gorhom/portal";
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
	useRef,
	useState,
} from "react";
import { Pressable, ScrollView, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { cn } from "~/utils";
import { Icon, IconButton } from "./icons";
import { PressableFeedback } from "./links";
import { P } from "./text";

const MenuContext = createContext<((open: boolean) => void) | undefined>(
	undefined,
);

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
	const alreadyRendered = useRef(false);
	const [isOpen, setOpen] =
		outerOpen !== undefined && outerSetOpen
			? [outerOpen, outerSetOpen]
			: // biome-ignore lint/correctness/useHookAtTopLevel: const
				useState(false);

	// does the same as a useMemo but for props.
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
				{...(props as AsProps)}
			/>
			{isOpen && (
				<Portal>
					<MenuContext.Provider value={setOpen}>
						<Pressable
							onPress={() => setOpen(false)}
							tabIndex={-1}
							className="absolute inset-0 flex-1 bg-transparent"
						/>
						<View
							className={cn(
								"absolute bottom-0 w-full self-center bg-popover pb-safe sm:mx-12 sm:max-w-2xl",
								"mt-20 max-h-[80vh] rounded-t-4xl pt-8",
								"xl:top-0 xl:right-0 xl:mr-0 xl:rounded-l-4xl xl:rounded-tr-0",
							)}
						>
							<ScrollView>
								<IconButton
									icon={Close}
									onPress={() => setOpen(false)}
									className="hidden self-end xl:flex"
								/>
								{children}
							</ScrollView>
						</View>
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
	...props
}: {
	label: string;
	selected?: boolean;
	left?: ReactElement;
	disabled?: boolean;
	icon?: ComponentType<SvgProps>;
} & (
	| { onSelect: () => void; href?: undefined }
	| { href: string; onSelect?: undefined }
)) => {
	const setOpen = useContext(MenuContext);
	const router = useRouter();

	const icn = (icon || selected) && (
		<Icon
			icon={icon ?? Check}
			fillClassName={cn(disabled && "accent-slate-600")}
			className="mx-2"
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
			className="h-10 w-full flex-row items-center px-4"
			{...props}
		>
			{left && left}
			{!left && icn && icn}
			<P
				className={cn("flex-1", disabled && "text-slate-600")}
				style={{
					paddingLeft: 8 * 2 + +!(icon || selected || left) * 24,
				}}
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
