import { prefix } from "inline-style-prefixer";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Slot } from "one";
// import { Providers } from "~/providers";
// import { createStyleRegistry, StyleRegistryProvider, useTheme } from "yoshiki/web";
// import { WebTooltip } from "@kyoo/primitives/src/tooltip.web";
// import { HiddenIfNoJs, SkeletonCss, TouchOnlyCss } from "@kyoo/primitives";
import { useServerHeadInsertion } from "one";

const GlobalCssTheme = () => {
	console.log(prefix("test"))
	const theme = useTheme();
	// TODO: add fonts here
	// body {font-family: ${font.style.fontFamily};}
	return (
		<>
			<style jsx global>{`
				body {
					margin: 0px;
					padding: 0px;
					overflow: "hidden";
					background-color: ${theme.background};
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
	const registry = createStyleRegistry();
	useServerHeadInsertion(() => registry.flushToComponent());

	// TODO: change this lang attr
	return (
		<StyleRegistryProvider registry={registry}>
			<html lang="en-US">
				<head>
					<title>Kyoo</title>
					<meta charSet="utf-8" />
					<meta name="description" content="A portable and vast media library solution." />
					<link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
					<link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
					<link rel="icon" type="image/png" sizes="64x64" href="/icon-64x64.png" />
					<link rel="icon" type="image/png" sizes="128x128" href="/icon-128x128.png" />
					<link rel="icon" type="image/png" sizes="256x256" href="/icon-256x256.png" />
					<GlobalCssTheme />
				</head>

				<body className="hoverEnabled">
					{/* <Providers> */}
						<Slot />
						<ReactQueryDevtools initialIsOpen={false} />
					{/* </Providers> */}
				</body>
			</html>
		</StyleRegistryProvider>
	);
}
