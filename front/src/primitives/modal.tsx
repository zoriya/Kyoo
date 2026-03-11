import Close from "@material-symbols/svg-400/rounded/close.svg";
import { Stack, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { cn } from "~/utils";
import { IconButton } from "./icons";
import { Heading } from "./text";

export const Modal = ({
	title,
	children,
	scroll = true,
}: {
	title: string;
	children: ReactNode;
	scroll?: boolean;
}) => {
	const router = useRouter();
	const close = () => {
		if (router.canGoBack()) router.back();
	};

	return (
		<>
			<Stack.Screen
				options={{
					presentation: "transparentModal",
					headerShown: false,
					contentStyle: {
						backgroundColor: "transparent",
					},
				}}
			/>
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
						<Heading>{title}</Heading>
						<IconButton icon={Close} onPress={close} />
					</View>
					{scroll ? (
						<ScrollView className="p-6">{children}</ScrollView>
					) : (
						<View className="flex-1">{children}</View>
					)}
				</Pressable>
			</Pressable>
		</>
	);
};
