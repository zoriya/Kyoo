import { Elysia } from "elysia";

export const EntriesController = new Elysia()
	.get('/entries', () => "hello");
