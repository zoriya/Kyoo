import { Union } from "@data-client/rest";
import { z } from "zod/v4";
import { Collection } from "./collection";
import { Movie } from "./movie";
import { Serie } from "./serie";

export const Show = Object.assign(
	new Union(
		{
			get serie() {
				return Serie;
			},
			get movie() {
				return Movie;
			},
			get collection() {
				return Collection;
			},
		},
		"kind",
	),
	{
		parser: z.lazy(() =>
			z.discriminatedUnion("kind", [
				Serie.parser,
				Movie.parser,
				Collection.parser,
			]),
		),
	},
);
export type Show = Serie | Movie | Collection;

export type WatchStatusV = NonNullable<Serie["watchStatus"]>["status"];
export const WatchStatusV = [
	"completed",
	"watching",
	"rewatching",
	"dropped",
	"planned",
] as const;
