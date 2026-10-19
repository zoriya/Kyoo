import { ScrollView } from "react-native";
import { FocusGroup } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { AccountSettings } from "./account";
import { About, GeneralSettings } from "./general";
import { LibrarySettings } from "./library";
import { OidcSettings } from "./oidc";
import { ChapterSkipSettings, PlaybackSettings } from "./playback";
import { SessionsSettings } from "./sessions";

export const SettingsPage = () => {
	const account = useAccount();

	return (
		<FocusGroup autoFocus className="flex-1">
			<ScrollView
				snapToAlignment="item"
				focusable={false}
				contentContainerClassName="gap-8"
			>
				<GeneralSettings />
				{account && <LibrarySettings />}
				{account && <PlaybackSettings />}
				{account && <ChapterSkipSettings />}
				{account && <AccountSettings />}
				{account && <SessionsSettings />}
				{account && <OidcSettings />}
				<About />
			</ScrollView>
		</FocusGroup>
	);
};
