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

				<link rel="icon" type="image/svg+xml" href="/icon.svg" />
				<link
					rel="shortcut icon"
					href="/favicon.ico"
					media="(prefers-color-scheme: light)"
				/>
				<link
					rel="icon"
					type="image/png"
					href="/favicon-96x96.png"
					sizes="96x96"
					media="(prefers-color-scheme: light)"
				/>
				<link
					rel="shortcut icon"
					href="/favicon-dark.ico"
					media="(prefers-color-scheme: dark)"
				/>
				<link
					rel="icon"
					type="image/png"
					href="/favicon-96x96-dark.png"
					sizes="96x96"
					media="(prefers-color-scheme: dark)"
				/>
				<meta name="apple-mobile-web-app-title" content="Kyoo" />
				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/apple-touch-icon.png"
				/>
				<link rel="manifest" href="/site.webmanifest" />

				<ScrollViewStyleReset />
			</head>
			<body className="hoverEnabled">{children}</body>
		</html>
	);
}
