import type { SenderDisconnectedEvent } from "chromecast-caf-receiver/cast.framework.system";

// the caf sdk exports this one but never documented it, so @types does not have it.
declare module "chromecast-caf-receiver/cast.framework" {
	interface CastReceiverContext {
		/**
		 * Replaces what the framework does when the last connected sender disconnects
		 * gracefully: with no handler set it shuts the receiver application down.
		 *
		 * Optional because it is undocumented - call it with `?.()`.
		 */
		setLastSenderDisconnectedHandler?(
			handler: (event: SenderDisconnectedEvent) => void,
		): void;
	}
}
