import Close from "@material-symbols/svg-400/rounded/close.svg";
import { usePathname } from "expo-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { BackHandler, Pressable, ScrollView, View } from "react-native";
import { Portal } from "react-native-teleport";
import { cn } from "~/utils";
import { FocusGroup, preferFocus } from "./focus";
import { Icon, IconButton, type Icon as IconType } from "./icons";
import { Heading } from "./text";

export const Overlay = ({
	icon,
	title,
	close,
	children,
	scroll = true,
	className,
	...props
}: {
	icon?: IconType;
	title: string;
	close?: () => void;
	children: ReactNode;
	scroll?: boolean;
	className?: string;
}) => {
	return (
		<Pressable
			className="absolute inset-0 cursor-default! items-center justify-center bg-black/60 max-md:px-4"
			onPress={close}
		>
			<Pressable
				className={cn(
					"w-full max-w-3xl rounded-md bg-background",
					"max-h-[90vh] cursor-default! overflow-hidden",
				)}
				onPress={(e) => e.preventDefault()}
			>
				<View className="flex-row items-center justify-between p-6">
					<View className="flex-row items-center gap-2">
						{icon && <Icon icon={icon} />}
						<Heading>{title}</Heading>
					</View>
					{/* the popup has to take the selection off the page behind it, and the
					    one control every popup has is the one that closes it. */}
					{close && (
						<IconButton icon={Close} onPress={close} {...preferFocus()} />
					)}
				</View>
				{scroll ? (
					<ScrollView
						className={cn("native:max-h-[85vh] p-6", className)}
						{...props}
					>
						{children}
					</ScrollView>
				) : (
					<View className={cn("web:flex-1", className)} {...props}>
						{children}
					</View>
				)}
			</Pressable>
		</Pressable>
	);
};

export const Popup = ({
	icon,
	title,
	close,
	children,
	scroll,
	...props
}: {
	icon?: IconType;
	title: string;
	close?: () => void;
	children: ReactNode;
	scroll?: boolean;
	className?: string;
}) => {
	const pathname = usePathname();
	const prevPathname = useRef(pathname);
	// The trap can only go up once the focus is already inside: a focus guide that
	// traps a direction also refuses to let the focus in through it.
	const [trapped, setTrapped] = useState(false);
	useEffect(() => {
		setTrapped(true);
		// while this is up it is the whole screen as far as a remote is concerned,
		// so back has to dismiss it rather than the page under it.
		const back = BackHandler.addEventListener("hardwareBackPress", () => {
			close?.();
			return true;
		});
		return () => back.remove();
	}, [close]);

	useEffect(() => {
		if (prevPathname.current !== pathname) {
			prevPathname.current = pathname;
			close?.();
		}
	}, [pathname, close]);

	return (
		<Portal hostName="root" style={{ pointerEvents: "auto" }}>
			<FocusGroup
				className="absolute inset-0"
				trapFocusUp={trapped}
				trapFocusDown={trapped}
				trapFocusLeft={trapped}
				trapFocusRight={trapped}
			>
				<Overlay
					icon={icon}
					title={title}
					close={close}
					scroll={scroll}
					{...props}
				>
					{children}
				</Overlay>
			</FocusGroup>
		</Portal>
	);
};
