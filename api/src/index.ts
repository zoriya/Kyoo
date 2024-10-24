import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

if (!process.env.DATABASE_URL) {
	console.error("Missing `DATABASE_URL` environment variable. Exiting");
	process.exit(1);
}

const db = drizzle(process.env.DATABASE_URL);

await migrate(db, { migrationsFolder: "" });

const app = new Elysia()
	.use(swagger())
	.get("/", () => "Hello Elysia")
	.listen(3000);

console.log(`Api running at ${app.server?.hostname}:${app.server?.port}`);
