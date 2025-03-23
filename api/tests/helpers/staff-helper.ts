import { buildUrl } from "tests/utils";
import { app } from "~/base";

export const getStaff = async (id: string, query: {}) => {
	const resp = await app.handle(
		new Request(buildUrl(`staff/${id}`, query), {
			method: "GET",
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

export const getStaffRoles = async (
	staff: string,
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
	const resp = await app.handle(
		new Request(buildUrl(`staff/${staff}/roles`, opts), {
			method: "GET",
			headers: langs
				? {
						"Accept-Language": langs,
					}
				: {},
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

export const getSerieStaff = async (
	serie: string,
	opts: {
		filter?: string;
		limit?: number;
		after?: string;
		sort?: string | string[];
	},
) => {
	const resp = await app.handle(
		new Request(buildUrl(`series/${serie}/staff`, opts), {
			method: "GET",
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

export const getMovieStaff = async (
	movie: string,
	opts: {
		filter?: string;
		limit?: number;
		after?: string;
		sort?: string | string[];
	},
) => {
	const resp = await app.handle(
		new Request(buildUrl(`movies/${movie}/staff`, opts), {
			method: "GET",
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};
