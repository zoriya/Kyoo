import type { z } from "zod/v4";
import type { KyooError } from "~/models";
import { RetryableError } from "~/models/retryable-error";

/**
 * Transport helpers shared by the react-query hooks and the local db sync.
 * Kept free of react-native imports so it can run in plain node/bun (tests).
 */

export const ssrApiUrl = process.env.KYOO_URL ?? "http://api:3567/api";

const cleanSlash = (str: string | null) => {
	if (str === null) return null;
	return str.replace(/\/$/g, "");
};

export const queryFn = async <Parser extends z.ZodTypeAny>(context: {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	url: string;
	body?: object;
	formData?: FormData;
	plainText?: boolean;
	authToken: string | null;
	lang?: string;
	parser: Parser | null;
	signal?: AbortSignal;
}): Promise<z.infer<Parser>> => {
	// Server side rendering: relative urls must target the api container.
	if (typeof window === "undefined" && context.url.startsWith("/"))
		context.url = `${ssrApiUrl}${context.url}`;
	let resp: Response;
	try {
		resp = await fetch(context.url, {
			method: context.method,
			body: context.body ? JSON.stringify(context.body) : context.formData,
			headers: {
				...(context.authToken
					? { Authorization: `Bearer ${context.authToken}` }
					: {}),
				...(context.body ? { "Content-Type": "application/json" } : {}),
				"Accept-Language": `${context.lang ?? "en"}, en, *`,
			},
			signal: context.signal,
		});
	} catch (e) {
		if (typeof e === "object" && e && "name" in e && e.name === "AbortError")
			throw { message: "Aborted", status: "aborted" } as KyooError;
		console.log("Fetch error", e, context.url);
		throw new RetryableError({
			key: "offline",
		});
	}
	if (resp.status === 404) {
		throw { message: "Resource not found.", status: 404 } as KyooError;
	}
	if (!resp.ok) {
		const error = await resp.text();
		let data: Record<string, any>;
		try {
			data = JSON.parse(error);
		} catch (e) {
			data = { message: error } as KyooError;
		}
		data.status = resp.status;
		console.log(
			`Invalid response (${context.method ?? "GET"} ${context.url}):`,
			data,
			resp.status,
		);
		throw data as KyooError;
	}

	if (resp.status === 204) return null!;

	if (context.plainText) return (await resp.text()) as any;

	let data: Record<string, any>;
	try {
		data = await resp.json();
	} catch (e) {
		console.error("Invalid json from kyoo", e);
		throw {
			message: `Invalid response from kyoo at ${context.url}`,
			status: "json",
		} as KyooError;
	}
	if (!context.parser) return data as any;
	const parsed = await context.parser.safeParseAsync(data);
	if (!parsed.success) {
		console.log(
			"Url: ",
			context.url,
			" Response: ",
			resp.status,
			" Parse error: ",
			parsed.error,
		);
		console.log(parsed.error.issues);
		throw {
			status: "parse",
			message:
				"Invalid response from kyoo. Possible version mismatch between the server and the application.",
		} as KyooError;
	}
	return parsed.data;
};

export const toQueryKey = (query: {
	apiUrl: string;
	path: (string | undefined)[];
	params?: {
		[query: string]: boolean | number | string | string[] | undefined;
	};
}) => {
	return [
		cleanSlash(query.apiUrl),
		...query.path,
		query.params
			? `?${Object.entries(query.params)
					.filter(
						([_, v]) =>
							v !== undefined && (Array.isArray(v) ? v.length > 0 : true),
					)
					.map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(",") : v}`)
					.join("&")}`
			: undefined,
	].filter((x) => x !== undefined);
};

export const keyToUrl = (key: ReturnType<typeof toQueryKey>) => {
	return key.join("/").replace("/?", "?");
};
