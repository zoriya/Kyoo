import { useTranslation } from "react-i18next";
import { type PressableProps, View } from "react-native";
import { type KImage, Role } from "~/models";
import { Container, H2, Link, P, Poster, Skeleton, SubP } from "~/primitives";
import { InfiniteGrid, type QueryIdentifier } from "~/query";
import { cn } from "~/utils";
import { EmptyView } from "../empty-view";

export const CharacterCard = ({
	href,
	name,
	subtitle,
	image,
	characterImage,
	...props
}: {
	href: string;
	name: string;
	subtitle: string;
	image: KImage | null;
	characterImage?: KImage | null;
} & PressableProps) => {
	return (
		<Link
			href={href}
			className={cn(
				"flex-row items-center overflow-hidden rounded-xl bg-card outline-0",
				"highlighted:outline-3 highlighted:outline-accent",
			)}
			{...props}
		>
			{({ focused, hovered }) => (
				<>
					<Poster src={image} quality="low" className="w-28" />
					<View className="flex-1 items-center justify-center py-5">
						<P
							data-highlighted={focused || hovered || undefined}
							className="text-center font-semibold data-highlighted:underline"
							numberOfLines={2}
						>
							{name}
						</P>
						<SubP className="mt-1 text-center" numberOfLines={2}>
							{subtitle}
						</SubP>
					</View>
					{characterImage && (
						<Poster src={characterImage} quality="low" className="w-28" />
					)}
				</>
			)}
		</Link>
	);
};

CharacterCard.Loader = () => (
	<View className="flex-row items-center overflow-hidden rounded-xl bg-card">
		<Poster.Loader className="w-28" />
		<View className="flex-1 items-center justify-center px-3">
			<Skeleton className="h-5 w-4/5" />
			<Skeleton className="mt-2 h-4 w-3/5" />
		</View>
		<Poster.Loader className="w-28" />
	</View>
);

export const Staff = ({
	kind,
	slug,
}: {
	kind: "serie" | "movie";
	slug: string;
}) => {
	const { t } = useTranslation();

	return (
		<Container className="mb-4">
			<InfiniteGrid
				query={Staff.query(kind, slug)}
				layout={{
					numColumns: { xs: 1, md: 2, xl: 3 },
					numLines: 3,
					gap: { xs: 8, lg: 12 },
				}}
				Header={({ controls }) => (
					<View className="mb-3 flex-row items-center justify-between">
						<H2>{t("show.staff")}</H2>
						{controls}
					</View>
				)}
				Empty={<EmptyView message={t("show.staff-none")} />}
				Render={({ item }) => (
					<CharacterCard
						href={`/staff/${item.staff.slug}`}
						name={item.staff.name}
						subtitle={
							item.character
								? t("show.staff-as", {
										character: item.character.name,
									})
								: t(`show.staff-kind.${item.kind}`)
						}
						image={item.staff.image}
						characterImage={item.character?.image}
					/>
				)}
				Loader={() => <CharacterCard.Loader />}
				getItemKey={(item) =>
					`${item.staff.id}-${item.kind}-${item.character?.name ?? "none"}`
				}
			/>
		</Container>
	);
};

Staff.query = (
	kind: "serie" | "movie",
	slug: string,
): QueryIdentifier<Role> => ({
	path: ["api", `${kind}s`, slug, "staff"],
	parser: Role,
	infinite: true,
});
