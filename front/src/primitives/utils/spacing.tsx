import "~/global.css";
import { Platform } from "react-native";
import { Uniwind } from "uniwind";

export const rem = (spacing: number) => {
	return (
		spacing *
		(Platform.OS !== "web"
			? (Uniwind.getCSSVariable("--spacing") as number)
			: 16)
	);
};
