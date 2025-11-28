import { eq, sql } from "drizzle-orm";
import { db } from "~/db";
import { roles, staff } from "~/db/schema";
import { conflictUpdateAllExcept, unnestValues } from "~/db/utils";
import type { SeedStaff } from "~/models/staff";
import { record } from "~/otel";
import { enqueueOptImage, flushImageQueue, type ImageTask } from "../images";

export const insertStaff = record(
	"insertStaff",
	async (seed: SeedStaff[] | undefined, showPk: number) => {
		if (!seed?.length) return [];

		return await db.transaction(async (tx) => {
			const imgQueue: ImageTask[] = [];
			const people = seed.map((x) => ({
				...x.staff,
				image: enqueueOptImage(imgQueue, {
					url: x.staff.image,
					column: staff.image,
				}),
			}));
			const ret = await tx
				.insert(staff)
				.select(unnestValues(people, staff))
				.onConflictDoUpdate({
					target: staff.slug,
					set: conflictUpdateAllExcept(staff, [
						"pk",
						"id",
						"slug",
						"createdAt",
					]),
				})
				.returning({ pk: staff.pk, id: staff.id, slug: staff.slug });

			const rval = seed.map((x, i) => ({
				showPk,
				staffPk: ret[i].pk,
				kind: x.kind,
				order: i,
				character: {
					...x.character,
					image: enqueueOptImage(imgQueue, {
						url: x.character.image,
						table: roles,
						column: sql`${roles.character}['image']`,
					}),
				},
			}));

			await flushImageQueue(tx, imgQueue, -200);

			// always replace all roles. this is because:
			//  - we want `order` to stay in sync (& without duplicates)
			//  - we don't have ways to identify a role so we can't onConflict
			await tx.delete(roles).where(eq(roles.showPk, showPk));
			await tx.insert(roles).select(unnestValues(rval, roles));

			return ret;
		});
	},
);
