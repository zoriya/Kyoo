import {
	type IRestEndpoint,
	RestEndpoint,
	type RestGenerics,
} from "@data-client/rest";
import { Platform } from "react-native";
import type { z } from "zod/v4";
import type { KyooError } from "~/models";
import { RetryableError } from "~/models/retryable-error";
import type { Params } from "./query";

const ssrApiUrl = process.env.KYOO_URL ?? "http://api:3567/api";

export type Auth = { apiUrl: string; authToken: string | null; lang: string };

export interface KyooEndpoint<O extends RestGenerics> {
	auth: Auth;
	parser: z.ZodType;
}

export class KyooEndpoint<O extends RestGenerics> extends RestEndpoint<O> {
	url(...args: Parameters<IRestEndpoint<O>["url"]>): string {
		const [params] = args as [Record<string, unknown>?];
		// `next` links sent by the api are complete urls
		if (typeof params?.next === "string") return params.next;
		const url = super.url(...args);
		if (Platform.OS === "web" && typeof window === "undefined")
			return `${ssrApiUrl}${url}`;
		return `${this.auth.apiUrl.replace(/\/$/, "")}${url}`;
	}

	searchToString(params: Params): string {
		return Object.entries(params)
			.filter(
				([_, v]) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true),
			)
			.map(
				([k, v]) =>
					`${k}=${encodeURIComponent(Array.isArray(v) ? v.join(",") : String(v))}`,
			)
			.sort()
			.join("&");
	}

	getHeaders(headers: HeadersInit): HeadersInit {
		return {
			...headers,
			...(this.auth.authToken
				? { Authorization: `Bearer ${this.auth.authToken}` }
				: {}),
			"Accept-Language": `${this.auth.lang}, en, *`,
		};
	}

	async fetchResponse(input: RequestInfo, init: RequestInit) {
		let resp: Response;
		try {
			resp = await fetch(input, init);
		} catch (e) {
			if (typeof e === "object" && e && "name" in e && e.name === "AbortError")
				throw { message: "Aborted", status: "aborted" } as KyooError;
			console.log("Fetch error", e, input);
			throw new RetryableError({ key: "offline" });
		}
		if (resp.status === 404)
			throw { message: "Resource not found.", status: 404 } as KyooError;
		if (!resp.ok) {
			const error = await resp.text();
			let data: KyooError;
			try {
				data = { ...JSON.parse(error), status: resp.status };
			} catch {
				data = { message: error, status: resp.status };
			}
			console.log(`Invalid response (${init.method ?? "GET"} ${input}):`, data);
			if (resp.status === 401 || resp.status === 403)
				throw new RetryableError({
					key: this.auth.authToken ? "unauthorized" : "needAccount",
					inner: data,
				});
			throw data;
		}
		return resp;
	}

	process(
		value: unknown,
		...args: Parameters<IRestEndpoint<O>["url"]>
	): ReturnType<IRestEndpoint<O>["process"]> {
		const parsed = this.parser.safeParse(value);
		if (parsed.success)
			return parsed.data as ReturnType<IRestEndpoint<O>["process"]>;
		console.log("Url:", this.url(...args), "Parse error:", parsed.error.issues);
		throw {
			status: "parse",
			message:
				"Invalid response from kyoo. Possible version mismatch between the server and the application.",
		} as KyooError;
	}

	errorPolicy(error: unknown) {
		if (error instanceof RetryableError && error.key === "offline")
			return "soft" as const;
		if (
			typeof error === "object" &&
			error &&
			"status" in error &&
			typeof error.status === "number" &&
			error.status >= 500
		)
			return "soft" as const;
		return undefined;
	}
}
