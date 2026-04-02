import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { SearchMovie, SearchSerie } from "~/models";
import { useMutation } from "~/query";
import { useQueryState } from "~/utils";
import { AddPage } from "./add";

const RemapPage = ({ kind }: { kind: "movie" | "serie" }) => {
	const [slug] = useQueryState("slug", undefined!);
	const { t } = useTranslation();
	const router = useRouter();
	const remap = useMutation({
		method: "POST",
		path: ["scanner", kind === "movie" ? "movies" : "series", slug, "remap"],
		compute: (item: SearchMovie | SearchSerie) => ({
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
		}),
		invalidate: null,
	});

	return (
		<AddPage
			title={t("show.remap")}
			allowLibrary={false}
			initialKind={kind}
			videos={[]}
			onSearchSelect={async (item) => {
				await remap.mutateAsync(item);
				router.navigate("/");
			}}
		/>
	);
};

export const MovieRemapModal = () => <RemapPage kind="movie" />;

export const SerieRemapModal = () => <RemapPage kind="serie" />;
