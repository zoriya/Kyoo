import {
	type Collection,
	CollectionP,
	type KyooImage,
	type QueryIdentifier,
	useInfiniteFetch,
} from "@kyoo/models";
import {
	Container,
	focusReset,
	GradientImageBackground,
	H2,
	ImageBackground,
	Link,
	P,
	ts,
} from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { type Theme, useYoshiki } from "yoshiki/native";

export const PartOf = ({
	name,
	overview,
	thumbnail,
	href,
}: {
	name: string;
	overview: string | null;
	thumbnail: KyooImage | null;
	href: string;
}) => {
	const { css, theme } = useYoshiki("part-of-collection");
	const { t } = useTranslation();

	return (
		<Link
			href={href}
			{...css({
				borderRadius: 16,
				overflow: "hidden",
				borderWidth: ts(0.5),
				borderStyle: "solid",
				borderColor: (theme) => theme.background,
				fover: {
					self: { ...focusReset, borderColor: (theme: Theme) => theme.accent },
					title: { textDecorationLine: "underline" },
				},
			})}
		>
			<GradientImageBackground
				src={thumbnail}
				alt=""
				quality="medium"
				gradient={{
					colors: [theme.darkOverlay, "transparent"],
					start: { x: 0, y: 0 },
					end: { x: 1, y: 0 },
				}}
				{...css({
					padding: ts(3),
				})}
			>
				<H2 {...css("title")}>
					{t("show.partOf")} {name}
				</H2>
				<P {...css({ textAlign: "justify" })}>{overview}</P>
			</GradientImageBackground>
		</Link>
	);
};

export const DetailsCollections = ({
	type,
	slug,
}: {
	type: "movie" | "show";
	slug: string;
}) => {
	const { items } = useInfiniteFetch(DetailsCollections.query(type, slug));
	const { css } = useYoshiki();

	// Since most items dont have collections, not having a skeleton reduces layout shifts.
	if (!items) return null;

	return (
		<Container {...css({ marginY: ts(2) })}>
			{items.map((x) => (
				<PartOf
					key={x.id}
					name={x.name}
					overview={x.overview}
					thumbnail={x.thumbnail}
					href={x.href}
				/>
			))}
		</Container>
	);
};

DetailsCollections.query = (
	type: "movie" | "show",
	slug: string,
): QueryIdentifier<Collection> => ({
	parser: CollectionP,
	path: [type, slug, "collections"],
	params: {
		limit: 0,
	},
	infinite: true,
});
