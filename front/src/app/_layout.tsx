import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Slot } from "expo-router";
import { Platform } from "react-native";
import { Providers } from "~/providers";
import "../global.css";
import { Tooltip } from "~/primitives";
import "~/fonts.web.css";

export default function Layout() {
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
