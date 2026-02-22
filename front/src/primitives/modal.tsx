import Close from "@material-symbols/svg-400/rounded/close.svg";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { cn } from "~/utils";
import { IconButton } from "./icons";
import { Heading } from "./text";

export const Modal = ({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) => {
	const router = useRouter();

	return (
		<Pressable
			className="absolute inset-0 cursor-default! items-center justify-center bg-black/60 max-md:px-4"
			onPress={() => {
				if (router.canGoBack()) router.back();
			}}
		>
			<Pressable
				className={cn(
					"w-full max-w-3xl rounded-md bg-background p-6",
					"max-h-[90vh] cursor-default! overflow-hidden",
				)}
				onPress={(e) => e.stopPropagation()}
			>
				<View className="mb-4 flex-row items-center justify-between">
					<Heading>{title}</Heading>
					<IconButton
						icon={Close}
						onPress={() => {
							if (router.canGoBack()) router.back();
						}}
					/>
				</View>
				<ScrollView>{children}</ScrollView>
			</Pressable>
		</Pressable>
	);
};
