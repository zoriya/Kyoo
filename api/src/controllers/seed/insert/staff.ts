import { eq, sql } from "drizzle-orm";
import { db } from "~/db";
import { roles, staff } from "~/db/schema";
import { conflictUpdateAllExcept, unnestValues } from "~/db/utils";
import type { SeedStaff } from "~/models/staff";
import { record } from "~/otel";
import { uniqBy } from "~/utils";
import { enqueueOptImage, flushImageQueue, type ImageTask } from "../images";

export const insertStaff = record(
	"insertStaff",
	async (seed: SeedStaff[] | undefined, showPk: number) => {
		if (!seed?.length) return [];

		return await db.transaction(async (tx) => {
			const imgQueue: ImageTask[] = [];
			const people = uniqBy(
				seed.map((x) => ({
					...x.staff,
					image: enqueueOptImage(imgQueue, {
						url: x.staff.image,
						column: staff.image,
					}),
				})),
				(x) => x.slug,
			);
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

			// always replace all roles. this is because:
			//  - we want `order` to stay in sync (& without duplicates)
			//  - we don't have ways to identify a role so we can't onConflict
			// ids of roles that look the same are reused so they stay stable across rescans
			const old = await tx
				.delete(roles)
				.where(eq(roles.showPk, showPk))
				.returning({
					id: roles.id,
					staffPk: roles.staffPk,
					kind: roles.kind,
					character: roles.character,
				});

			const rval = seed.map((x, i) => {
				const staffPk = ret.find((y) => y.slug === x.staff.slug)!.pk;
				const idx = old.findIndex(
					(y) =>
						y.staffPk === staffPk &&
						y.kind === x.kind &&
						y.character?.name === x.character?.name,
				);
				return {
					id: idx !== -1 ? old.splice(idx, 1)[0].id : crypto.randomUUID(),
					showPk,
					staffPk,
					kind: x.kind,
					order: i,
					character: x.character
						? {
								...x.character,
								image: enqueueOptImage(imgQueue, {
									url: x.character.image,
									table: roles,
									column: sql`${roles.character}['image']`,
								}),
							}
						: null,
				};
			});

			await flushImageQueue(tx, imgQueue, -200);

			await tx.insert(roles).select(unnestValues(rval, roles));

			return ret;
		});
	},
);
