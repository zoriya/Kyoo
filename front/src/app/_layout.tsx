import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Slot } from "expo-router";
import { Platform } from "react-native";
import { Providers } from "~/providers";
import "../global.css";
import { Tooltip } from "~/primitives";

const GlobalCssTheme = () => {
	// body {font-family: ${font.style.fontFamily};}
	// background-color: ${theme.background};
	return (
		<>
			{/* <SkeletonCss /> */}
			{/* <TouchOnlyCss /> */}
			{/* <HiddenIfNoJs /> */}
		</>
	);
};

export default function Layout() {
	// const registry = createStyleRegistry();
	// useServerHeadInsertion(() => registry.flushToComponent());

	return (
		<Providers>
			<Slot />
			{Platform.OS === "web" && (
				<>
					<ReactQueryDevtools initialIsOpen={false} />
					<Tooltip />
				</>
			)}
		</Providers>
	);
}
