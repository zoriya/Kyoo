import type { SeedCollection } from "~/models/collections";
import { insertShow } from "./shows";

export const insertCollection = async (collection?: SeedCollection) => {
	if (!collection) return null;
	const { translations: colTrans, ...col } = collection;
	// TODO: need to compute start/end year & if missing tags & genres
	const { updated, status, ...ret } = await insertShow(
		{
			kind: "collection",
			status: "unknown",
			nextRefresh,
			...col,
		},
		colTrans,
	);
	return ret;
};
