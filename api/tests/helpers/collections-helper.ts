import { buildUrl } from "tests/utils";
import { handlers } from "~/base";
import { getJwtHeaders } from "./jwt";

export const getCollection = async (
	id: string,
	{
		langs,
		...query
	}: { langs?: string; preferOriginal?: boolean; with?: string[] },
) => {
	const resp = await handlers.handle(
		new Request(buildUrl(`collections/${id}`, query), {
			method: "GET",
			headers: langs
				? {
						"Accept-Language": langs,
						...(await getJwtHeaders()),
					}
				: await getJwtHeaders(),
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

export const getCollections = async ({
	langs,
	...query
}: {
	langs?: string;
	preferOriginal?: boolean;
	with?: string[];
}) => {
	const resp = await handlers.handle(
		new Request(buildUrl("collections", query), {
			method: "GET",
			headers: langs
				? {
						"Accept-Language": langs,
						...(await getJwtHeaders()),
					}
				: await getJwtHeaders(),
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};
