import { t } from "elysia";

export type Sort<
	T extends string[],
	Remap extends Partial<Record<T[number], string>>,
> = {
	sort: {
		key: Exclude<T[number], keyof Remap> | NonNullable<Remap[keyof Remap]>;
		remmapedKey?: keyof Remap;
		desc: boolean;
	}[];
	random?: { seed: number };
};

export type NonEmptyArray<T> = [T, ...T[]];

export const Sort = <
	const T extends NonEmptyArray<string>,
	const Remap extends Partial<Record<T[number], string>>,
>(
	values: T,
	{
		description = "How to sort the query",
		default: def,
		remap,
	}: {
		default?: T[number][];
		description: string;
		remap: Remap;
	},
) =>
	t
		.Transform(
			t.Array(
				t.Union([
					t.Literal("random"),
					t.TemplateLiteral("random:${number}"),
					t.UnionEnum([
						...values,
						...values.map((x: T[number]) => `-${x}` as const),
					]),
				]),
				{
					// TODO: support explode: true (allow sort=slug,-createdAt). needs a pr to elysia
					explode: false,
					default: def,
					description: description,
				},
			),
		)
		.Decode((sort): Sort<T, Remap> => {
			const sortItems: Sort<T, Remap>["sort"] = [];
			let random: Sort<T, Remap>["random"] = undefined;
			for (const x of sort) {
				const desc = x[0] === "-";
				const key = (desc ? x.substring(1) : x) as T[number];
				if (key == "random") {
					random = {
						seed: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
					};
					continue;
				} else if (key.startsWith("random:")) {
					const strSeed = key.replace("random:", "");
					random = {
						seed: parseInt(strSeed),
					};
					continue;
				}

				if (key in remap) {
					sortItems.push({ key: remap[key]!, remmapedKey: key, desc });
				} else {
					sortItems.push({
						key: key as Exclude<typeof key, keyof Remap>,
						desc,
					});
				}
			}
			return {
				sort: sortItems,
				random,
			};
		})
		.Encode(() => {
			throw new Error("Encode not supported for sort");
		});
