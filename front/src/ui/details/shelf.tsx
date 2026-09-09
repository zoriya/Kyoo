import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { Chip, H2, rem, SideMenu, Skeleton, SubP } from "~/primitives";
import { Fetch } from "~/query";
import { ExternalIdChip, Header } from "./header";
import { Staff } from "./staff";

export const InfoShelf = ({
	kind,
	slug,
	isOpen,
	close,
}: {
	kind: "movie" | "serie" | "collection";
	slug: string;
	isOpen: boolean;
	close: () => void;
}) => {
	const { t } = useTranslation();

	return (
		<SideMenu
			isOpen={isOpen}
			onClose={close}
			containerClassName="w-110 max-w-none"
		>
			<ScrollView
				snapToAlignment="item"
				contentContainerClassName="gap-4 p-4 pb-16"
			>
				<Fetch
					query={Header.query(kind, slug)}
					Render={(data) => (
						<>
							<View
								collapsable={false}
								scrollSnapOffset={rem(4)}
								className="gap-1"
							>
								<H2>{t("show.genre")}</H2>
								{data.genres.length ? (
									<View className="flex-row flex-wrap gap-1">
										{data.genres.map((genre) => (
											<Chip
												key={genre}
												label={t(`genres.${genre}`)}
												href={`/browse?filter=genres has ${genre.toLowerCase()}`}
												size="small"
												outline
											/>
										))}
									</View>
								) : (
									<SubP>{t("show.genre-none")}</SubP>
								)}
							</View>
							<View
								collapsable={false}
								scrollSnapOffset={rem(4)}
								className="gap-1"
							>
								<H2>{t("show.tags")}</H2>
								{data.tags.length ? (
									<View className="flex-row flex-wrap gap-1">
										{data.tags.map((tag) => (
											<Chip
												key={tag}
												label={tag}
												href={`/browse?q=${tag}`}
												size="small"
											/>
										))}
									</View>
								) : (
									<SubP>{t("show.tags-none")}</SubP>
								)}
							</View>
							{data.kind !== "collection" && !!data.studios?.length && (
								<View
									collapsable={false}
									scrollSnapOffset={rem(4)}
									className="gap-1"
								>
									<H2>{t("show.studios")}</H2>
									<View className="flex-row flex-wrap gap-1">
										{data.studios.map((x) => (
											<Chip
												key={x.id}
												label={x.name}
												href={`/browse?filter=studios has ${x.slug}`}
												size="small"
												outline
											/>
										))}
									</View>
								</View>
							)}
							<View
								collapsable={false}
								scrollSnapOffset={rem(4)}
								className="gap-1"
							>
								<H2>{t("show.links")}</H2>
								<View className="flex-row flex-wrap">
									{Object.entries(data.externalId).map(([name, items]) => (
										<ExternalIdChip key={name} name={name} items={items} />
									))}
								</View>
							</View>
						</>
					)}
					Loader={() => <Skeleton lines={6} />}
				/>
				{kind !== "collection" && (
					<View collapsable={false} scrollSnapOffset={rem(4)}>
						<Staff
							kind={kind}
							slug={slug}
							layout={{ numColumns: 1, numLines: 3, gap: rem(1) }}
						/>
					</View>
				)}
			</ScrollView>
		</SideMenu>
	);
};
