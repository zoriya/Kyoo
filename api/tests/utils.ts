import { expect } from "bun:test";
import Elysia from "elysia";

export function expectStatus(resp: Response, body: object) {
	const matcher = expect({ ...body, status: resp.status });
	return {
		toBe: (status: number) => {
			matcher.toMatchObject({ status: status });
		},
	};
}

export const buildUrl = (route: string, query: Record<string, any>) => {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (!Array.isArray(value)) {
			params.append(key, value.toString());
			continue;
		}
		for (const v of value) params.append(key, v.toString());
	}
	return `http://localhost/${route}?${params}`;
};
