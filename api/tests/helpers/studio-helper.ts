import { buildUrl } from "tests/utils";
import { handlers } from "~/base";
import { getJwtHeaders } from "./jwt";

export const getStudio = async (
	id: string,
	{ langs, ...query }: { langs?: string; preferOriginal?: boolean },
) => {
	const resp = await handlers.handle(
		new Request(buildUrl(`studios/${id}`, query), {
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

export const getShowsByStudio = async (
	studio: string,
	{
		langs,
		...opts
	}: {
		filter?: string;
		limit?: number;
		after?: string;
		sort?: string | string[];
		query?: string;
		langs?: string;
		preferOriginal?: boolean;
	},
) => {
	const resp = await handlers.handle(
		new Request(buildUrl(`studios/${studio}/shows`, opts), {
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
