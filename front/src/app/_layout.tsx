import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Slot } from "expo-router";
import { LogBox, Platform } from "react-native";
import { Providers } from "~/providers";
import "../global.css";
import { Tooltip, useMobileHover } from "~/primitives";
import "~/fonts.web.css";

export const unstable_settings = {
	initialRouteName: "(app)",
};

// the logbox toast is drawn on top of our header, and its tv-only "dismiss"
// button sits in the same place so the dpad can never focus it: once a warning
// shows up it stays there for good. logs are still printed in the metro
// console and fatal errors still open the fullscreen inspector (which the back
// button closes).
if (__DEV__ && Platform.isTV) LogBox.ignoreAllLogs();

export default function Layout() {
	useMobileHover();

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
