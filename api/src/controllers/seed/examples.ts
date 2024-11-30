import { db } from "~/db";
import { videos } from "~/db/schema";
import { bubble, bubbleVideo } from "~/models/examples";
import { seedMovie } from "./movies";

const videoExamples = [bubbleVideo];

export const seedTests = async () => {
	await db.insert(videos).values(videoExamples).onConflictDoNothing();
	await seedMovie(bubble)
};
