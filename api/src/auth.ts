import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "./db";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		usePlural: true,
	}),
	appName: "Kyoo",
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
		minPasswordLength: 4,
	},
	advanced: {
		generateId: false,
	},
	plugins: [username()],
});
