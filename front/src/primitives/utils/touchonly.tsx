import { Platform, type ViewProps } from "react-native";

export const TouchOnlyCss = () => {
	return (
		<style jsx global>{`
			:where(body.noHover) .noTouch {
				display: none;
			}
			:where(body:not(.noHover)) .touchOnly {
				display: none;
			}
		`}</style>
	);
};

export const touchOnly: ViewProps = {
	style:
		Platform.OS === "web"
			? ({ $$css: true, touchOnly: "touchOnly" } as any)
			: {},
};
export const noTouch: ViewProps = {
	style:
		Platform.OS === "web"
			? ({ $$css: true, noTouch: "noTouch" } as any)
			: { display: "none" },
};

export const useIsTouch = () => {
	if (Platform.OS !== "web") return true;
	if (typeof window === "undefined") return false;
	// TODO: Subscribe to the change.
	return document.body.classList.contains("noHover");
};
