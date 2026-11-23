import type { KyooError } from "./kyoo-error";

export class RetryableError extends Error {
	public key: string;
	public retry?: () => Promise<void>;
	public inner?: Error | KyooError;

	constructor({
		key,
		retry,
		inner,
	}: {
		key: string;
		retry?: () => Promise<void>;
		inner?: Error | KyooError;
	}) {
		// shown as is by forms & alerts, the key is only used by error pages
		super(inner?.message ?? key);
		this.key = key;
		this.retry = retry;
		this.inner = inner;
	}
}
