import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import { migrate } from "drizzle-orm/node-postgres/migrator";

await migrate(db, { migrationsFolder: "" });

const app = new Elysia()
	.use(swagger())
	.get("/", () => "Hello Elysia")
	.listen(3000);

console.log(`Api running at ${app.server?.hostname}:${app.server?.port}`);
