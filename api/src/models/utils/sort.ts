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
			const random = sort.find((x) => x.startsWith("random"));
			if (random) {
				const seed = random.includes(":")
					? Number.parseInt(random.substring("random:".length))
					: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
				return { random: { seed }, sort: [] };
			}
			return {
				sort: sort.map((x) => {
					const desc = x[0] === "-";
					const key = (desc ? x.substring(1) : x) as T[number];
					if (key in remap) return { key: remap[key]!, remmapedKey: key, desc };
					return { key: key as Exclude<typeof key, keyof Remap>, desc };
				}),
			};
		})
		.Encode(() => {
			throw new Error("Encode not supported for sort");
		});
