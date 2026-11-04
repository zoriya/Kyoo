import { useController, useLive } from "@data-client/react";
import { Collection, type Schema, type SchemaSimple } from "@data-client/rest";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { z } from "zod/v4";
import { Paged } from "~/models";
import { useToken } from "~/providers/account-context";
import { KyooEndpoint } from "./endpoint";

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
