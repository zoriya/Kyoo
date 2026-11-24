import { INVALID } from "@data-client/normalizr";
import {
	type Controller,
	GCPolicy,
	type Manager,
	type Middleware,
	type State,
} from "@data-client/react";
import { decode, ExtensionCodec, encode } from "@msgpack/msgpack";
import Constants from "expo-constants";
import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "kyoo-data" });

// msgpack keeps dates, but not the symbol of deleted entities
const extensionCodec = new ExtensionCodec();
extensionCodec.register({
	type: 0,
	encode: (x) => (x === INVALID ? new Uint8Array() : null),
	decode: () => INVALID,
});

// one store per account
export const storeKey = (account?: { apiUrl: string; id: string }) =>
	`${account?.apiUrl} ${account?.id}`;

export const removePersistedState = (key: string) => storage.remove(key);

export const readPersistedState = (key: string): State<unknown> | undefined => {
	// entities are restored as is (zod only parses network responses), the
	// models of another version of the app could have changed.
	const version = Constants.expoConfig?.version ?? "";
	if (storage.getString("version") !== version) {
		storage.clearAll();
		storage.set("version", version);
	}
	const raw = storage.getBuffer(key);
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
	controller?: Controller;

	constructor(private key: string) {}

	middleware: Middleware = (controller) => {
		this.controller = controller;
		return (next) => async (action) => {
			await next(action);
			clearTimeout(this.timer);
			this.timer = setTimeout(() => this.save(), 1000);
		};
	};

	save() {
		this.timer = undefined;
		const state = this.controller!.getState();
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
			this.key,
			data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
		);
	}

	cleanup() {
		clearTimeout(this.timer);
		// unmounted when the account changes, keep its last changes. unless the
		// account was removed (logout), its store is already deleted.
		if (this.timer !== undefined && storage.contains(this.key)) this.save();
	}
}

export const persistManagers = (key: string): Manager[] => [
	new PersistManager(key),
];

export const persistGcPolicy = () =>
	new GCPolicy({
		expiresAt: ({ fetchedAt }) => fetchedAt + 30 * 24 * 60 * 60 * 1000,
	});
