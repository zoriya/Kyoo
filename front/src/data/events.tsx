import { useController } from "@data-client/react";
import { Invalidate } from "@data-client/rest";
import { Event, Show } from "~/models";
import { useToken } from "~/providers/account-context";
import { useInvalidate } from "./query";
import { useWebsockets } from "./websockets";

export const LiveUpdates = () => {
	const ctrl = useController();
	const invalidate = useInvalidate();
	const { apiUrl } = useToken();

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
					else if (event.action === "updated")
						invalidate({
							path: ["api", `${event.kind}s`, event.slug],
							nested: true,
						});
					else {
						invalidate(["api", "shows"]);
						invalidate(["api", `${event.kind}s`]);
						invalidate(["api", "news"]);
					}
					return;
				case "video":
					invalidate({ path: ["api", "videos"], nested: true });
					return;
				case "video-link":
					invalidate({
						path: ["api", `${event.show.kind}s`, event.show.slug],
						nested: true,
					});
					return;
			}
		},
	});
	return null;
};
