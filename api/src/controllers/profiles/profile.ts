import { eq, sql } from "drizzle-orm";
import { db } from "~/db";
import { profiles } from "~/db/schema";

export async function getOrCreateProfile(userId: string) {
	// id of the guest user
	if (userId === "00000000-0000-0000-0000-000000000000") return null;

	let [profile] = await db
		.select({ pk: profiles.pk })
		.from(profiles)
		.where(eq(profiles.id, userId))
		.limit(1);
	if (profile) return profile.pk;

	[profile] = await db
		.insert(profiles)
		.values({ id: userId })
		.onConflictDoUpdate({
			// we can't do `onConflictDoNothing` because on race conditions
			// we still want the profile to be returned.
			target: [profiles.id],
			set: { id: sql`excluded.id` },
		})
		.returning({ pk: profiles.pk });
	return profile.pk;
}
