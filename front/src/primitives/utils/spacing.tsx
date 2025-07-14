import { Platform } from "react-native";

export const important = <T,>(value: T): T => {
	return `${value} !important` as T;
};

export const ts = (spacing: number) => {
	return spacing * 8;
};

export const focusReset: object =
	Platform.OS === "web"
		? {
				boxShadow: "unset",
				outline: "none",
			}
		: {};
