import { useMemo } from "react";
import { Platform } from "react-native";
import { createMMKV, useMMKVString } from "react-native-mmkv";
import type { ZodType, z } from "zod/v4";
import { getServerData } from "~/utils";

export const storage = createMMKV({ id: "kyoo-v5" });

// btoa/atob only handle latin1, so go through the utf8 bytes
const toBase64 = (utf8: string) =>
	btoa(String.fromCharCode(...new TextEncoder().encode(utf8)));
const fromBase64 = (b64: string) =>
	new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));

export const setCookie = (
	key: string,
	val?: unknown,
	opts?: { skipBase64?: boolean },
) => {
	const value = opts?.skipBase64
		? val
		: toBase64(typeof val !== "string" ? JSON.stringify(val) : val);
	const d = new Date();
	// A year
	d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000);
	const expires = value
		? `expires=${d.toUTCString()}`
		: "expires=Thu, 01 Jan 1970 00:00:01 GMT";
	// biome-ignore lint/suspicious/noDocumentCookie: idk
	document.cookie = `${key}=${value};${expires};path=/;samesite=strict`;
};

export const readCookie = <T extends ZodType>(key: string, parser: T) => {
	const cookies = getServerData("cookies");
	const decodedCookie = decodeURIComponent(cookies);
	const ca = decodedCookie.split(";");

	const name = `${key}=`;
	const ret = ca.find((x) => x.trimStart().startsWith(name));
	if (ret === undefined) return undefined;
	const str = fromBase64(ret.substring(name.length));
	return parser.parse(JSON.parse(str)) as z.infer<T>;
};

export const useStoreValue = <T extends ZodType>(key: string, parser: T) => {
	const [val] = useMMKVString(key, storage);
	return useMemo(
		() =>
			val === undefined ? val : (parser.parse(JSON.parse(val)) as z.infer<T>),
		[val, parser],
	);
};

export const storeValue = (key: string, value: unknown) => {
	storage.set(key, JSON.stringify(value));
};

export const readValue = <T extends ZodType>(key: string, parser: T) => {
	if (Platform.OS === "web" && typeof window === "undefined") {
		return readCookie(key, parser);
	}
	const val = storage.getString(key);
	if (val === undefined) return val;
	return parser.parse(JSON.parse(val)) as z.infer<T>;
};

export const useLocalSetting = <T extends string>(setting: string, def: T) => {
	const [val, setter] = useMMKVString(`settings.${setting}`, storage);
	return [(val ?? def) as T, setter] as const;
};

export const getLocalSetting = (setting: string, def: string) => {
	if (Platform.OS === "web" && typeof window === "undefined") return def;
	return storage.getString(`settings.${setting}`) ?? setting;
};
