import { z } from "zod";
import { User } from "./user";

export const AccountP = User.and(
	z.object({
		token: TokenP,
		apiUrl: z.string(),
		selected: z.boolean(),
	}),
);
export type Account = z.infer<typeof AccountP>;
