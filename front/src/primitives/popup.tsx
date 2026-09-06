import Close from "@material-symbols/svg-400/rounded/close.svg";
import { usePathname } from "expo-router";
import { type ReactNode, useEffect, useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Portal } from "react-native-teleport";
import { cn } from "~/utils";
import { FocusTrap } from "./focus";
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
		<FocusTrap onBack={close} className="absolute inset-0">
			<Pressable
				className="absolute inset-0 cursor-default! items-center justify-center bg-black/60 max-md:px-4"
				onPress={close}
				tabIndex={-1}
			>
				<Pressable
					className={cn(
						"w-full max-w-3xl rounded-md bg-background",
						"max-h-[90vh] cursor-default! overflow-hidden",
					)}
					onPress={(e) => e.preventDefault()}
					tabIndex={-1}
				>
					<View className="min-h-22 flex-row items-center gap-2 p-6 pr-16">
						{icon && <Icon icon={icon} />}
						<Heading>{title}</Heading>
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
					{/* last in the tree so a remote only lands here when nothing above takes the focus */}
					{close && (
						<IconButton
							icon={Close}
							onPress={close}
							className="absolute top-6 right-6"
						/>
					)}
				</Pressable>
			</Pressable>
		</FocusTrap>
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

	useEffect(() => {
		if (prevPathname.current !== pathname) {
			prevPathname.current = pathname;
			close?.();
		}
	}, [pathname, close]);

	return (
		<Portal hostName="root" style={{ pointerEvents: "auto" }}>
			<Overlay
				icon={icon}
				title={title}
				close={close}
				scroll={scroll}
				{...props}
			>
				{children}
			</Overlay>
		</Portal>
	);
};
