import { ScrollView } from "react-native";
import { useAccount } from "~/providers/account-context";
import { AccountSettings } from "./account";
import { About, GeneralSettings } from "./general";
// import { OidcSettings } from "./oidc";
import { PlaybackSettings } from "./playback";

export const SettingsPage = () => {
	const account = useAccount();
	return (
		<ScrollView contentContainerClassName="gap-8 pb-8">
			<GeneralSettings />
			{account && <PlaybackSettings />}
			{account && <AccountSettings />}
			{/* {account && <OidcSettings />} */}
			<About />
		</ScrollView>
	);
};
