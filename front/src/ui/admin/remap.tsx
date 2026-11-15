import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useMutation } from "~/data";
import type { SearchMovie, SearchSerie } from "~/models";
import { useQueryState } from "~/utils";
import { AddPage } from "./add";

const RemapPage = ({ kind }: { kind: "movie" | "serie" }) => {
	const [slug] = useQueryState("slug", undefined!);
	const { t } = useTranslation();
	const router = useRouter();
	const remap = useMutation((item: SearchMovie | SearchSerie) => ({
		method: "POST",
		path: ["scanner", kind === "movie" ? "movies" : "series", slug, "remap"],
		body: {
			title: item.name,
			year:
				"airDate" in item
					? item.airDate?.getFullYear()
					: item.startAir?.getFullYear(),
			externalId: Object.fromEntries(
				Object.entries(item.externalId).map(([k, v]) => [k, v[0].dataId]),
			),
			videos: [],
		},
	}));

	return (
		<AddPage
			title={t("show.remap")}
			allowLibrary={false}
			initialKind={kind}
			videos={[]}
			onSearchSelect={async (item) => {
				await remap.mutate(item);
				router.navigate("/");
			}}
		/>
	);
};

export const MovieRemapModal = () => <RemapPage kind="movie" />;

export const SerieRemapModal = () => <RemapPage kind="serie" />;
