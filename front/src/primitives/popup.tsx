import { usePortal } from "@gorhom/portal";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { px, vh } from "yoshiki/native";
import { Container } from "./container";
import { ContrastArea, SwitchVariant, type YoshikiFunc } from "./theme";
import { ts } from "./utils";

export const Popup = ({
	children,
	...props
}: {
	children: ReactNode | YoshikiFunc<ReactNode>;
}) => {
	return (
		<ContrastArea mode="user">
			<SwitchVariant>
				{({ css, theme }) => (
					<View
						{...css({
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							bg: (theme) => theme.themeOverlay,
							justifyContent: "center",
							alignItems: "center",
						})}
					>
						<Container
							{...css(
								{
									borderRadius: px(6),
									paddingHorizontal: 0,
									bg: (theme) => theme.background,
									overflow: "hidden",
								},
								props,
							)}
						>
							<ScrollView
								contentContainerStyle={{
									paddingHorizontal: px(15),
									paddingVertical: ts(4),
									gap: ts(2),
								}}
								{...css({
									maxHeight: vh(95),
									flexGrow: 0,
									flexShrink: 1,
								})}
							>
								{typeof children === "function"
									? children({ css, theme })
									: children}
							</ScrollView>
						</Container>
					</View>
				)}
			</SwitchVariant>
		</ContrastArea>
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
