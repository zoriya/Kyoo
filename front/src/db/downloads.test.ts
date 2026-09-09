import { describe, expect, test } from "bun:test";
import { createLiveQueryCollection, eq } from "@tanstack/react-db";
import { downloads } from "./downloads";
import { testClient, tick } from "./fixtures.test-helpers";

describe("downloads (local only collection)", () => {
	test("rows are local, validated and live", async () => {
		const downloadsC = testClient().collection(downloads);
		const live = createLiveQueryCollection({
			startSync: true,
			query: (q) =>
				q
					.from({ d: downloadsC })
					.where(({ d }) => eq(d.videoId, "v1"))
					.findOne(),
		});
		await live.toArrayWhenReady();

		downloadsC.insert({
			videoId: "v1",
			entrySlug: "entry-1",
			path: "/sdcard/kyoo/v1.mkv",
			status: "queued",
			progress: 0,
			size: null,
			createdAt: new Date(),
		});
		await tick();
		expect(live.toArray[0]?.status).toBe("queued");

		downloadsC.update("v1", (d) => {
			d.progress = 100;
			d.status = "done";
		});
		await tick();
		expect(live.toArray[0]?.status).toBe("done");

		expect(() =>
			downloadsC.insert({ videoId: "v2", progress: 200 } as never),
		).toThrow();
	});
});
