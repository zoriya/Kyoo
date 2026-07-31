import { Portal } from "@gorhom/portal";
import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { cn } from "~/utils";
import { IconButton } from "./icons";
import { Heading } from "./text";

export const SideMenu = ({
	isOpen,
	title,
	onClose,
	children,
	className,
	containerClassName,
}: {
	isOpen: boolean;
	title?: string;
	onClose: () => void;
	children: ReactNode;
	className?: string;
	containerClassName?: string;
}) => {
	if (!isOpen) return null;

	return (
		<Portal>
			<Pressable
				onPress={onClose}
				className="absolute inset-0 cursor-default! bg-black/60"
				tabIndex={-1}
			/>
			<View
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
			</View>
		</Portal>
	);
};
