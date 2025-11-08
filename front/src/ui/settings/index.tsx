import { ScrollView } from "react-native";
import { ts } from "~/primitives";
import { useAccount } from "~/providers/account-context";
// import { AccountSettings } from "./account";
// import { About, GeneralSettings } from "./general";
// import { OidcSettings } from "./oidc";
// import { PlaybackSettings } from "./playback";

export const SettingsPage = () => {
	const account = useAccount();
	return (
		<ScrollView contentContainerStyle={{ gap: ts(4), paddingBottom: ts(4) }}>
			{/* <GeneralSettings /> */}
			{/* {account && <PlaybackSettings />} */}
			{/* {account && <AccountSettings />} */}
			{/* {account && <OidcSettings />} */}
			{/* <About /> */}
		</ScrollView>
	);
};
