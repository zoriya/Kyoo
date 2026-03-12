import { usePortal } from "@gorhom/portal";
import Close from "@material-symbols/svg-400/rounded/close.svg";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { cn } from "~/utils";
import { Icon, IconButton, type Icon as IconType } from "./icons";
import { Heading } from "./text";

export const Overlay = ({
	icon,
	title,
	close,
	children,
	scroll = true,
}: {
	icon?: IconType;
	title: string;
	close?: () => void;
	children: ReactNode;
	scroll?: boolean;
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
					{close && <IconButton icon={Close} onPress={close} />}
				</View>
				{scroll ? (
					<ScrollView className="p-6">{children}</ScrollView>
				) : (
					<View className="flex-1">{children}</View>
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
}: {
	icon?: IconType;
	title: string;
	close?: () => void;
	children: ReactNode;
	scroll?: boolean;
}) => {
	return (
		<Overlay icon={icon} title={title} close={close} scroll={scroll}>
			{children}
		</Overlay>
	);
};

export const usePopup = () => {
	const { addPortal, removePortal } = usePortal();
	const [current, setPopup] = useState<ReactNode>();
	const close = useCallback(() => setPopup(undefined), []);

	useEffect(() => {
		addPortal("popup", current);
		return () => removePortal("popup");
	}, [current, addPortal, removePortal]);

	return [setPopup, close] as const;
};
