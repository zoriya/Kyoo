import { useEffect } from "react";
import { Platform } from "react-native";

let preventHover = false;
let hoverTimeout: NodeJS.Timeout | number;

export const useMobileHover = () => {
	if (Platform.OS !== "web") return;

	// biome-ignore lint/correctness/useHookAtTopLevel: const condition
	useEffect(() => {
		const enableHover = () => {
			if (preventHover) return;
			document.body.classList.remove("noHover");
		};

		const disableHover = () => {
			if (hoverTimeout) clearTimeout(hoverTimeout);
			preventHover = true;
			hoverTimeout = setTimeout(() => {
				preventHover = false;
			}, 1000);
			document.body.classList.add("noHover");
		};

		document.addEventListener("touchstart", disableHover, true);
		document.addEventListener("mousemove", enableHover, true);
		return () => {
			document.removeEventListener("touchstart", disableHover);
			document.removeEventListener("mousemove", enableHover);
		};
	}, []);
};

export const useIsTouch = () => {
	if (Platform.OS !== "web") return true;
	if (typeof window === "undefined") return false;
	// TODO: Subscribe to the change.
	return document.body.classList.contains("noHover");
};
