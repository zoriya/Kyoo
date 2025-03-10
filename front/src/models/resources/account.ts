import { z } from "zod";
import { zdate } from "../utils";
import { UserP } from "./user";

export const TokenP = z.object({
	token_type: z.literal("Bearer"),
	access_token: z.string(),
	refresh_token: z.string(),
	expire_in: z.string(),
	expire_at: zdate(),
});
export type Token = z.infer<typeof TokenP>;

export const AccountP = UserP.and(
	z.object({
		// set it optional for accounts logged in before the kind was present
		kind: z.literal("user").optional(),
		token: TokenP,
		apiUrl: z.string(),
		selected: z.boolean(),
	}),
);
export type Account = z.infer<typeof AccountP>;
