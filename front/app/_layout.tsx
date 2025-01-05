import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Slot } from "one";
import { Providers } from "~/providers";

export default function Layout() {
	return (
		<>
			{typeof document !== "undefined" && (
				<>
					<title>Kyoo</title>
					<meta name="description" content="A portable and vast media library solution." />
					<link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
					<link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
					<link rel="icon" type="image/png" sizes="64x64" href="/icon-64x64.png" />
					<link rel="icon" type="image/png" sizes="128x128" href="/icon-128x128.png" />
					<link rel="icon" type="image/png" sizes="256x256" href="/icon-256x256.png" />
				</>
			)}
			<Providers>
				<Slot />
				<ReactQueryDevtools initialIsOpen={false} />
			</Providers>
		</>
	);
}
