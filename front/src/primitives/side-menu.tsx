import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import {
	type ReactNode,
	type RefObject,
	useEffect,
	useRef,
	useState,
} from "react";
import { BackHandler, Pressable, View } from "react-native";
import { Portal } from "react-native-teleport";
import { cn } from "~/utils";
import { FocusGroup, requestFocus } from "./focus";
import { IconButton } from "./icons";
import { Heading } from "./text";

export const SideMenu = ({
	isOpen,
	title,
	onClose,
	children,
	className,
	containerClassName,
	returnFocus,
}: {
	isOpen: boolean;
	title?: string;
	onClose: () => void;
	children: ReactNode;
	className?: string;
	containerClassName?: string;
	// what to put the selection back on: the sheet takes it with it on the way
	// out and android has nothing to fall back to.
	returnFocus?: RefObject<View | null>;
}) => {
	// The trap can only go up once the focus is already inside: a focus guide that
	// traps a direction also refuses to let the focus in through it.
	const [trapped, setTrapped] = useState(false);
	const opened = useRef(false);
	useEffect(() => {
		if (!isOpen) {
			setTrapped(false);
			if (opened.current) requestFocus(returnFocus?.current);
			return;
		}
		opened.current = true;
		setTrapped(true);
		// while this is up it is the whole screen as far as a remote is concerned,
		// so back has to dismiss it rather than the page under it.
		const back = BackHandler.addEventListener("hardwareBackPress", () => {
			onClose();
			return true;
		});
		return () => back.remove();
	}, [isOpen, onClose, returnFocus]);

	if (!isOpen) return null;

	return (
		<Portal hostName="root" style={{ pointerEvents: "auto" }}>
			<Pressable
				onPress={onClose}
				className="absolute inset-0 cursor-default! bg-black/60"
				tabIndex={-1}
			/>
			<FocusGroup
				trapFocusUp={trapped}
				trapFocusDown={trapped}
				trapFocusLeft={trapped}
				trapFocusRight={trapped}
				className={cn(
					"absolute inset-y-0 right-0 w-4/5 max-w-xl bg-popover",
					"border-white/10 border-l pt-safe pr-safe pb-safe",
					containerClassName,
				)}
			>
				{title && (
					<View className="flex-row items-center justify-between border-white/10 border-b p-4">
						<Heading>{title}</Heading>
						<IconButton icon={Close} onPress={onClose} />
					</View>
				)}
				<View className={cn("flex-1", className)}>{children}</View>
			</FocusGroup>
		</Portal>
	);
};
