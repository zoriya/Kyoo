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

// LogBox is touch only. Its toast sits on top of our header with a dismiss
// button the dpad cannot reach, and an uncaught error opens a full screen
// inspector whose buttons it cannot reach either — one expired session and the
// remote has nothing left to talk to. `ignoreAllLogs` only silences the toast
// (react-native says so in as many words); an ignore pattern is what is checked
// before a fatal is allowed to open the inspector. Everything still prints in
// the metro console and the app's own error boundary still renders.
if (__DEV__ && Platform.isTV) LogBox.ignoreLogs([/[\s\S]*/]);

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
