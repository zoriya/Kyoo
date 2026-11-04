import { INVALID } from "@data-client/normalizr";
import type { Manager, Middleware, State } from "@data-client/react";
import { decode, ExtensionCodec, encode } from "@msgpack/msgpack";
import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "kyoo-data" });

// msgpack keeps dates, but not the symbol of deleted entities
const extensionCodec = new ExtensionCodec();
extensionCodec.register({
	type: 0,
	encode: (x) => (x === INVALID ? new Uint8Array() : null),
	decode: () => INVALID,
});

export const readPersistedState = (): State<unknown> | undefined => {
	const raw = storage.getBuffer("state");
	if (!raw) return undefined;
	try {
		return decode(raw, { extensionCodec }) as State<unknown>;
	} catch (e) {
		console.warn("Could not read the persisted store", e);
		return undefined;
	}
};

class PersistManager implements Manager {
	timer?: ReturnType<typeof setTimeout>;

	middleware: Middleware = (controller) => (next) => async (action) => {
		await next(action);
		clearTimeout(this.timer);
		this.timer = setTimeout(() => {
			const state = controller.getState();
			const data = encode(
				{
					...state,
					// errors & in-flight optimistic updates hold classes & functions
					meta: Object.fromEntries(
						Object.entries(state.meta).filter(([, x]) => !x.error),
					),
					optimistic: [],
				},
				{ extensionCodec, ignoreUndefined: true },
			);
			storage.set(
				"state",
				data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
			);
		}, 1000);
	};

	cleanup() {
		clearTimeout(this.timer);
	}
}

export const persistManagers = (): Manager[] => [new PersistManager()];
