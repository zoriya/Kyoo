import { useController } from "@data-client/react";
import { Invalidate } from "@data-client/rest";
import { useRef } from "react";
import { Event, Show } from "~/models";
import { setImagesReady } from "~/primitives/image/ready";
import { useToken } from "~/providers/account-context";
import { Header } from "~/ui/details/header";
import { type QueryIdentifier, useInvalidate, useMutation } from "./query";
import { useWebsockets } from "./websockets";

export const LiveUpdates = () => {
	const ctrl = useController();
	const invalidate = useInvalidate();
	const { apiUrl } = useToken();
	const { mutate: get } = useMutation(
		({ path, params }: QueryIdentifier<Show>) => ({
			method: "GET",
			path,
			params,
			schema: Show,
		}),
	);

	const tasks = useRef(new Map<string, () => unknown>());
	const later = (key: string, task: () => unknown) => {
		if (!tasks.current.size)
			setTimeout(() => {
				for (const task of tasks.current.values()) task();
				tasks.current.clear();
			}, 500);
		tasks.current.set(key, task);
	};
	const expire = (target: Parameters<typeof invalidate>[0]) =>
		later(JSON.stringify(target), () => invalidate(target));

	const refresh = (show: { kind: Show["kind"]; id: string; slug: string }) =>
		later(show.id, () => {
			invalidate({ path: ["api", `${show.kind}s`, show.slug], nested: true });
			const schema = Show.schema[show.kind];
			if (ctrl.get(schema, { id: show.id }, ctrl.getState()))
				get(Header.query(show.kind, show.slug)).catch(() => {});
		});

	useWebsockets({
		filterActions: [],
		enabled: apiUrl !== "",
		parser: Event,
		onMessage: (event) => {
			switch (event.kind) {
				case "movie":
				case "serie":
				case "collection":
					if (event.action === "deleted")
						ctrl.set(new Invalidate(Show.schema[event.kind]), { id: event.id });
					else if (event.action === "updated") refresh(event);
					else {
						expire(["api", `${event.kind}s`]);
						expire(["api", "news"]);
					}
					return;
				case "video":
					expire({ path: ["api", "videos"], nested: true });
					return;
				case "video-link":
					refresh(event.show);
					expire(["api", "videos", "unmatched"]);
					expire(["api", "news"]);
					return;
				case "watchstatus":
				case "progress":
					refresh(event.show);
					expire({ path: ["api", "profiles"], nested: true });
					return;
				case "image":
					setImagesReady(event.images);
					return;
			}
		},
	});
	return null;
};
