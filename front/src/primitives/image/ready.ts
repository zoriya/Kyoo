import { useCallback, useSyncExternalStore } from "react";
import type { KImage } from "~/models";

const pendingBlurhash = "000000";

const ready = new Set<string>();
const listeners = new Map<string, Set<() => void>>();

export const setImagesReady = (images: { id: string }[]) => {
	for (const { id } of images) {
		const subs = listeners.get(id);
		if (!subs) continue;
		ready.add(id);
		for (const cb of subs) cb();
	}
};

export const useIsImageReady = (src: KImage | null) => {
	// the id of an image the api hasn't downloaded yet
	const pending = src?.blurhash === pendingBlurhash ? src.id : null;
	const subscribe = useCallback(
		(cb: () => void) => {
			if (!pending) return () => {};
			const subs = listeners.get(pending) ?? new Set();
			listeners.set(pending, subs);
			subs.add(cb);
			return () => {
				subs.delete(cb);
				if (!subs.size) listeners.delete(pending);
			};
		},
		[pending],
	);
	const get = () => !pending || ready.has(pending);
	return useSyncExternalStore(subscribe, get, get);
};
