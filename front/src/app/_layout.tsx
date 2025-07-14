import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Slot } from "expo-router";
import { Platform } from "react-native";
import { Providers } from "~/providers";

const GlobalCssTheme = () => {
	// const theme = useTheme();
	// TODO: add fonts here
	// body {font-family: ${font.style.fontFamily};}
	// background-color: ${theme.background};
	return (
		<>
			<style>{`
				body {
					margin: 0px;
					padding: 0px;
					overflow: "hidden";
				}

				*::-webkit-scrollbar {
					height: 6px;
					width: 6px;
					background: transparent;
				}

				*::-webkit-scrollbar-thumb {
					background-color: #999;
					border-radius: 90px;
				}
				*:hover::-webkit-scrollbar-thumb {
					background-color: rgb(134, 127, 127);
				}

				#__next {
					height: 100vh;
				}

				.infinite-scroll-component__outerdiv {
					width: 100%;
					height: 100%;
				}

				::cue {
					background-color: transparent;
					text-shadow:
						-1px -1px 0 #000,
						1px -1px 0 #000,
						-1px 1px 0 #000,
						1px 1px 0 #000;
				}
			`}</style>
			{/* <WebTooltip theme={theme} /> */}
			{/* <SkeletonCss /> */}
			{/* <TouchOnlyCss /> */}
			{/* <HiddenIfNoJs /> */}
		</>
	);
};

export default function Layout() {
	// const registry = createStyleRegistry();
	// useServerHeadInsertion(() => registry.flushToComponent());

	// <GlobalCssTheme />
	return (
		<Providers>
			<Slot />
			{Platform.OS === "web" && <ReactQueryDevtools initialIsOpen={false} />}
		</Providers>
	);
}
