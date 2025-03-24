import { swagger } from "@elysiajs/swagger";
import { jwtSecret } from "./auth";
import { app } from "./base";
import { processImages } from "./controllers/seed/images";
import { migrate } from "./db";
import { comment } from "./utils";

await migrate();

if (!jwtSecret) {
	console.error("Missing jwt secret or auth server. exiting");
	process.exit(1);
}

// run image processor task in background
processImages();

app
	.use(
		swagger({
			documentation: {
				info: {
					title: "Kyoo",
					description: comment`
						Complete API documentation of Kyoo.
						If you need a route not present here, please make an issue over https://github.com/zoriya/kyoo
					`,
					version: "5.0.0",
					contact: { name: "github", url: "https://github.com/zoriya/kyoo" },
					license: {
						name: "GPL-3.0 license",
						url: "https://github.com/zoriya/Kyoo/blob/master/LICENSE",
					},
				},
				servers: [
					{
						url: "https://kyoo.zoriya.dev/api",
						description: "Kyoo's demo server",
					},
				],
				tags: [
					{
						name: "shows",
						description:
							"Routes to list movies, series & collections at the same time",
					},
					{ name: "movies", description: "Routes about movies" },
					{ name: "series", description: "Routes about series" },
					{ name: "collections", description: "Routes about collections" },
					{ name: "studios", description: "Routes about studios" },
					{ name: "staff", description: "Routes about staff & roles" },
					{
						name: "videos",
						description: comment`
							Used by the scanner internally to list & create videos.
							Can be used for administration or third party apps.
						`,
					},
					{
						name: "images",
						description: "Routes about images: posters, thumbnails...",
					},
				],
			},
		}),
	)
	.listen(3567);

console.log(`Api running at ${app.server?.hostname}:${app.server?.port}`);
