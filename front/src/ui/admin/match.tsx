import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import { useTranslation } from "react-i18next";
import { Fetch, type QueryIdentifier } from "~/data";
import { Video } from "~/models";
import { useQueryState } from "~/utils";
import { AddPage } from "./add";

export const MatchPage = () => {
	const [id] = useQueryState("id", undefined!);
	const { t } = useTranslation();

	return (
		<Fetch
			query={MatchPage.query(id)}
			Render={(video) => (
				<AddPage
					icon={Search}
					title={t("admin.unmatched.match-file", { file: video.path })}
					videos={[{ id, episodes: video.guess.episodes }]}
					allowLibrary
				/>
			)}
			Loader={() => (
				<AddPage
					icon={Search}
					title={t("misc.loading")}
					videos={[{ id, episodes: [] }]}
					allowLibrary
				/>
			)}
		/>
	);
};

MatchPage.query = (id: string): QueryIdentifier<Video> => ({
	schema: Video,
	path: ["api", "videos", id],
});
