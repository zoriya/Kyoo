import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
	// TODO: change this lang attr
	return (
		<html lang="en-US">
			<head>
				<title>Kyoo</title>
				<meta charSet="utf-8" />
				<meta
					name="description"
					content="A portable and vast media library solution."
				/>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, shrink-to-fit=no"
				/>
				<meta httpEquiv="X-UA-Compatible" content="IE=edge" />

				<link
					rel="icon"
					type="image/png"
					sizes="16x16"
					href="/icon-16x16.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="32x32"
					href="/icon-32x32.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="64x64"
					href="/icon-64x64.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="128x128"
					href="/icon-128x128.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="256x256"
					href="/icon-256x256.png"
				/>

				<ScrollViewStyleReset />
			</head>
			<body className="hoverEnabled">{children}</body>
		</html>
	);
}
