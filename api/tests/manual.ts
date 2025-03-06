import { db, migrate } from "~/db";
import { shows, videos } from "~/db/schema";
import { madeInAbyss, madeInAbyssVideo } from "~/models/examples";
import { createSerie, createVideo } from "./helpers";

// test file used to run manually using `bun tests/manual.ts`

await migrate();
await db.delete(shows);
await db.delete(videos);

const [_, vid] = await createVideo(madeInAbyssVideo);
console.log(vid);
const [__, ser] = await createSerie(madeInAbyss);
console.log(ser);
