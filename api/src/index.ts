import { opentelemetry } from "@elysiajs/opentelemetry";
import { swagger } from "@elysiajs/swagger";
import { elysiaLogger } from "@logtape/elysia";
import { getLogger } from "@logtape/logtape";
import { Elysia } from "elysia";
import { handlers } from "./base";
import { processImages } from "./controllers/seed/images";
import { db, migrate } from "./db";
import { setupLogging } from "./logtape";
import { setupOtel } from "./otel";
import { comment } from "./utils";

await setupLogging();
setupOtel();
const logger = getLogger();

const PATH_IGNORE = new Set(["/api/health", "/api/ready"]);

logger.info("Skipping request logging for these paths: {dropList}", {
	dropList: Array.from(PATH_IGNORE).sort(),
});

await migrate();

const disposeImages = await processImages();

const app = new Elysia()
	.use(
		elysiaLogger({
			skip: (ctx) => PATH_IGNORE.has(ctx.path),
		}),
	)
	.use(opentelemetry())
	.use(
		swagger({
			scalarConfig: {
				sources: [
					{ slug: "kyoo", url: "/swagger/json" },
					{ slug: "keibi", url: "/auth/swagger/doc.json" },
					{ slug: "scanner", url: "/scanner/openapi.json" },
					{ slug: "transcoder", url: "/video/swagger/doc.json" },
				],
			},
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
					{
						name: "profiles",
						description: "Routes about user profiles, watchlist & history.",
					},
				],
				components: {
					securitySchemes: {
						bearer: {
							type: "http",
							scheme: "bearer",
							bearerFormat: "opaque",
						},
						api: {
							type: "apiKey",
							in: "header",
							name: "X-API-KEY",
						},
					},
				},
			},
		}),
	)
	.use(handlers)
	.listen(3567);

process.on("SIGTERM", () => {
	app.stop().then(async () => {
		logger.info("API service state changed: {state}", {
			state: "stopping",
		});
		disposeImages();
		await db.$client.end();
		logger.info("API service state changed: {state}", {
			state: "stopped",
		});
		process.exit(0);
	});
});

logger.info("API service running at {hostname}:{port}", {
	hostname: app.server?.hostname,
	port: app.server?.port,
});
