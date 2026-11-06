import { useController, useLive } from "@data-client/react";
import {
	Collection,
	type Schema,
	type SchemaSimple,
	type SnapshotInterface,
} from "@data-client/rest";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { Paged } from "~/models";
import { useToken } from "~/providers/account-context";
import { KyooEndpoint } from "./endpoint";

type Method = "POST" | "PUT" | "PATCH" | "DELETE";
type Path = (string | undefined)[];
export type Params = {
	[query: string]: boolean | number | string | string[] | undefined;
};
export type QuerySchema<Data = unknown> = SchemaSimple<Data> & {
	parser: z.ZodType<Partial<Data>>;
};

export type QueryIdentifier<Data = unknown> = {
	schema: QuerySchema<Data>;
	path: Path;
	params?: Params;
	infinite?: boolean;
	refetchInterval?: number;
	apiUrl?: string;
};

const useQueryEndpoint = <S extends Schema>(
	{ path, params, refetchInterval, apiUrl }: QueryIdentifier,
	schema: S,
	parser: z.ZodType,
) => {
	const token = useToken();
	const { i18n } = useTranslation();
	const lang = i18n.resolvedLanguage ?? "en";
	const endpoint = useMemo(
		() =>
			new KyooEndpoint({
				path: "/*path",
				searchParams: {} as Params,
				schema,
				parser,
				paginationField: "next",
				pollFrequency: refetchInterval,
				auth: { ...token, apiUrl: apiUrl ?? token.apiUrl, lang },
			}),
		[schema, parser, refetchInterval, apiUrl, token, lang],
	);
	const args = { path: path.filter((x) => x !== undefined), ...params };
	const data = useLive(endpoint, args);
	return { endpoint, args, data };
};

export const useFetch = <Data>(query: QueryIdentifier<Data>) => {
	const { data } = useQueryEndpoint(query, query.schema, query.schema.parser);
	return data;
};

export const useInfiniteFetch = <Data>(query: QueryIdentifier<Data>) => {
	const ctrl = useController();
	const [schema, parser] = useMemo(
		() =>
			[
				{ items: new Collection([query.schema]), next: "" as string | null },
				Paged(query.schema.parser),
			] as const,
		[query.schema],
	);
	const { endpoint, args, data } = useQueryEndpoint(query, schema, parser);
	const [isRefetching, setRefetching] = useState(false);
	const [isFetchingNextPage, setFetchingNextPage] = useState(false);

	return {
		items: data.items,
		hasNextPage: !!data.next,
		isFetching: isFetchingNextPage,
		fetchNextPage: async () => {
			if (!data.next || isFetchingNextPage) return false;
			setFetchingNextPage(true);
			return ctrl
				.fetch(endpoint.getPage, { ...args, next: data.next })
				.then(
					() => true,
					() => false,
				)
				.finally(() => setFetchingNextPage(false));
		},
		refetch: async () => {
			setRefetching(true);
			await ctrl
				.fetch(endpoint, args)
				.catch(() => {})
				.finally(() => setRefetching(false));
		},
		isRefetching,
	};
};

export const useInvalidate = () => {
	const ctrl = useController();
	const { apiUrl } = useToken();
	return (path: Path) => {
		const prefix = `GET ${apiUrl.replace(/\/$/, "")}/${path.filter((x) => x !== undefined).join("/")}`;
		return ctrl.expireAll({
			testKey: (key) =>
				key.startsWith(prefix) && /^($|[/?])/.test(key.slice(prefix.length)),
		});
	};
};

export type Mutation = {
	method?: Method;
	path: Path;
	params?: Params;
	body?: object | FormData;
	apiUrl?: string;
	invalidate?: Path;
} & (
	| { schema?: undefined; rows?: undefined }
	// what the api answers, see `QuerySchema`
	| { schema: QuerySchema; rows?: undefined }
	// the rows this changes when the api doesn't answer them, shaped like it
	// would: they are updated everywhere before the request is sent & reverted
	// if it fails
	| { schema: Schema; rows: (snapshot: SnapshotInterface) => unknown }
);

export const useMutation = <T = void, Ret = unknown>(
	request: (param: T) => Mutation,
) => {
	const ctrl = useController();
	const token = useToken();
	const { i18n } = useTranslation();
	const expire = useInvalidate();
	const [isPending, setPending] = useState(false);

	const mutate = async (param: T) => {
		const {
			method = "POST",
			path,
			params,
			body,
			apiUrl,
			schema,
			rows,
			invalidate,
		} = request(param);
		let optimistic: unknown;
		const endpoint = new KyooEndpoint({
			path: "/*path",
			method,
			body,
			schema,
			// the api doesn't answer the rows `rows` changed, keep what we wrote
			parser: rows
				? z.unknown().transform(() => optimistic)
				: (schema?.parser ?? z.unknown()),
			auth: {
				...token,
				apiUrl: apiUrl ?? token.apiUrl,
				lang: i18n.resolvedLanguage ?? "en",
			},
			getOptimisticResponse: (snap: SnapshotInterface, ..._args: unknown[]) => {
				if (!rows) throw snap.abort;
				optimistic = rows(snap);
				return optimistic;
			},
		});
		setPending(true);
		try {
			const args = { path: path.filter((x) => x !== undefined), ...params };
			const ret = (await (body === undefined
				? ctrl.fetch(endpoint, args)
				: ctrl.fetch(endpoint, args, body))) as Ret;
			if (invalidate) await expire(invalidate);
			return ret;
		} finally {
			setPending(false);
		}
	};

	return {
		mutate,
		isPending,
	};
};

export const useRefresh = (queries: QueryIdentifier[]) => {
	const ctrl = useController();
	const token = useToken();
	const { i18n } = useTranslation();
	const [refreshing, setRefreshing] = useState(false);

	const refresh = useCallback(async () => {
		setRefreshing(true);
		await Promise.all(
			queries.map(({ schema, infinite, path, params, apiUrl }) =>
				ctrl.fetch(
					new KyooEndpoint({
						path: "/*path",
						searchParams: {} as Params,
						...(infinite
							? {
									schema: {
										items: new Collection([schema]),
										next: "" as string | null,
									},
									parser: Paged(schema.parser),
								}
							: { schema, parser: schema.parser }),
						auth: {
							...token,
							apiUrl: apiUrl ?? token.apiUrl,
							lang: i18n.resolvedLanguage ?? "en",
						},
					}),
					{ path: path.filter((x) => x !== undefined), ...params },
				),
			),
		).catch(() => {});
		setRefreshing(false);
	}, []);

	return [refreshing, refresh] as const;
};
