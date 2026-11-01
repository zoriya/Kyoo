import "react-native-get-random-values";
import { Platform } from "react-native";

// stolen from https://github.com/jimmywarting/groupby-polyfill/blob/main/lib/polyfill.js
// needed since hermes doesn't support Map.groupBy yet
if (Platform.OS !== "web") {
	Map.groupBy ??= function groupBy(iterable, callbackfn) {
		const map = new Map();
		let i = 0;
		for (const value of iterable) {
			const key = callbackfn(value, i++),
				list = map.get(key);
			list ? list.push(value) : map.set(key, [value]);
		}
		return map;
	};
}
