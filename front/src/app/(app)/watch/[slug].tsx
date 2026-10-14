import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useAccounts } from "~/providers/account-context";
import { Player } from "~/ui/player";
import { CastSessionProvider } from "~/ui/player/cast-session";

export { LayoutErrorBoundary as ErrorBoundary } from "~/ui/error-boundary";

export default function Watch() {
	// links from the android tv launcher specify the account they belong to
	const { account } = useLocalSearchParams<{ account?: string }>();
	const target = useAccounts().find((x) => x.id === account);

	useEffect(() => {
		if (target && !target.selected) target.select();
	}, [target]);

	if (target && !target.selected) return null;
	return (
		<CastSessionProvider>
			<Player />
		</CastSessionProvider>
	);
}
