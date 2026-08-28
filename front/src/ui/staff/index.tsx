import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { RoleWithShow, Staff as StaffModel } from "~/models";
import {
	Container,
	H1,
	Head,
	Poster,
	preferFocus,
	Skeleton,
	SubP,
	ts,
} from "~/primitives";
import { Fetch, InfiniteFetch, type QueryIdentifier } from "~/query";
import { useQueryState } from "~/utils";
import { CharacterCard } from "../details/staff";
import { EmptyView } from "../empty-view";

const StaffHeader = ({ slug }: { slug: string }) => {
	return (
		<Fetch
			query={StaffPage.staffQuery(slug)}
			Render={(staff) => (
				<Container className="my-4 flex-row items-center gap-4 rounded-2xl bg-card p-4">
					<Head title={staff.name} />
					<Poster src={staff.image} quality="medium" className="w-32" />
					<View className="flex-1">
						<H1 className="text-3xl">{staff.name}</H1>
						{staff.latinName && <SubP>{staff.latinName}</SubP>}
					</View>
				</Container>
			)}
			Loader={() => (
				<Container className="my-4 flex-row items-center gap-4 rounded-2xl bg-card p-4">
					<Skeleton className="h-24 w-24 rounded-xl" />
					<View className="flex-1">
						<Skeleton className="h-9 w-2/3" />
						<Skeleton className="mt-2 h-5 w-1/2" />
					</View>
				</Container>
			)}
		/>
	);
};

export const StaffPage = () => {
	const { t } = useTranslation();
	const [slug] = useQueryState<string>("slug", undefined!);

	return (
		<InfiniteFetch
			query={StaffPage.rolesQuery(slug)}
			layout={{
				layout: "grid",
				numColumns: { xs: 1, md: 2, lg: 3, xl: 4 },
				gap: { xs: ts(1), md: ts(2) },
				size: 112,
			}}
			Header={<StaffHeader slug={slug} />}
			Render={({ item, index }) => (
				<CharacterCard
					href={`/${item.show.kind}s/${item.show.slug}`}
					{...preferFocus(index === 0)}
					name={item.show.name}
					subtitle={
						item.character
							? t("show.staff-as", {
									character: item.character.name,
								})
							: t(`show.staff-kind.${item.kind}`)
					}
					image={item.show.poster}
					characterImage={item.character?.image}
				/>
			)}
			Loader={() => <CharacterCard.Loader />}
			Empty={<EmptyView message={t("show.staff-none")} className="py-8" />}
		/>
	);
};

StaffPage.staffQuery = (slug: string): QueryIdentifier<StaffModel> => ({
	path: ["api", "staff", slug],
	parser: StaffModel,
});

StaffPage.rolesQuery = (slug: string): QueryIdentifier<RoleWithShow> => ({
	path: ["api", "staff", slug, "roles"],
	parser: RoleWithShow,
	infinite: true,
});
