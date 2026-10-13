import { Player } from "~/ui/player";
import { CastSessionProvider } from "~/ui/player/cast-session";

export { LayoutErrorBoundary as ErrorBoundary } from "~/ui/error-boundary";

export default function Watch() {
	return (
		<CastSessionProvider>
			<Player />
		</CastSessionProvider>
	);
}
