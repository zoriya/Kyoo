import { expect } from "bun:test";

export function expectStatus(resp: Response, body: object) {
	const matcher = expect({ ...body, status: resp.status });
	return {
		toBe: (status: number) => {
			matcher.toMatchObject({ status: status });
		},
	};
}

export const buildUrl = (route: string, query?: Record<string, any>) => {
	const params = new URLSearchParams();
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (!Array.isArray(value)) {
				params.append(key, value.toString());
				continue;
			}
			for (const v of value) params.append(key, v.toString());
		}
	}
	return params.size
		? `http://localhost/${route}?${params}`
		: `http://localhost/${route}`;
};
