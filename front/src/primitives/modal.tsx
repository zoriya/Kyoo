import { Stack, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Portal } from "react-native-teleport";
import type { Icon } from "./icons";
import { Overlay } from "./popup";

export const Modal = ({
	icon,
	title,
	children,
	scroll = true,
}: {
	icon?: Icon;
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
			<Portal hostName="root" style={{ pointerEvents: "auto" }}>
				<Overlay icon={icon} title={title} close={close} scroll={scroll}>
					{children}
				</Overlay>
			</Portal>
		</>
	);
};
