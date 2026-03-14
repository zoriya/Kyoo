import Close from "@material-symbols/svg-400/rounded/close-fill.svg";
import LibraryAdd from "@material-symbols/svg-400/rounded/library_add-fill.svg";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { FullVideo, type Movie } from "~/models";
import {
	Button,
	ComboBox,
	IconButton,
	Modal,
	P,
	Skeleton,
	tooltip,
} from "~/primitives";
import { useFetch, useMutation } from "~/query";
import { useQueryState } from "~/utils";
import { Header } from "../../details/header";

const MoviePathItem = ({
	id,
	path,
	movieSlug,
}: {
	id: string;
	path: string;
	movieSlug: string;
}) => {
	const { t } = useTranslation();
	const { mutateAsync } = useMutation({
		method: "PUT",
		path: ["api", "videos", "link"],
		compute: (videoId: string) => ({
			body: [{ id: videoId, for: [] }],
		}),
		invalidate: ["api", "movies", movieSlug],
	});

	return (
		<View className="mx-6 min-h-12 flex-1 flex-row items-center justify-between hover:bg-card">
			<View className="flex-1 flex-row items-center pr-1">
				<IconButton
					icon={Close}
					onPress={async () => {
						await mutateAsync(id);
					}}
					{...tooltip(t("videos-map.delete"))}
				/>
				<P className="wrap-anywhere flex-1 flex-wrap">{path}</P>
			</View>
		</View>
	);
};

MoviePathItem.Loader = () => {
	return (
		<View className="mx-6 min-h-12 flex-1 flex-row items-center justify-between hover:bg-card">
			<View className="flex-1 flex-row items-center pr-1">
				<IconButton icon={Close} />
				<Skeleton className="w-4/5" />
			</View>
		</View>
	);
};

const AddMovieVideoFooter = ({ slug }: { slug: string }) => {
	const { t } = useTranslation();
	const { mutateAsync } = useMutation({
		method: "PUT",
		path: ["api", "videos", "link"],
		compute: (videoId: string) => ({
			body: [{ id: videoId, for: [{ movie: slug }] }],
		}),
		invalidate: ["api", "movies", slug],
	});

	return (
		<ComboBox
			Trigger={(props) => (
				<Button
					icon={LibraryAdd}
					text={t("videos-map.add")}
					className="m-6 mt-10"
					onPress={props.onPress ?? (props as any).onClick}
					{...props}
				/>
			)}
			searchPlaceholder={t("navbar.search")}
			value={null}
			query={(q) => ({
				parser: FullVideo,
				path: ["api", "videos"],
				params: {
					query: q,
					sort: "path",
				},
				infinite: true,
			})}
			getKey={(x) => x.id}
			getLabel={(x) => x.path}
			onValueChange={async (x) => {
				if (x) await mutateAsync(x.id);
			}}
		/>
	);
};

export const MovieVideosModal = () => {
	const [slug] = useQueryState<string>("slug", undefined!);
	const { data } = useFetch(Header.query("movie", slug));
	const { t } = useTranslation();

	const videos = (data as Movie)?.videos;

	return (
		<Modal title={data?.name ?? t("misc.loading")}>
			{videos && videos.length > 0 ? (
				videos.map((video) => (
					<MoviePathItem
						key={video.id}
						id={video.id}
						path={video.path}
						movieSlug={slug}
					/>
				))
			) : videos ? (
				<P className="flex-1 self-center p-6">{t("videos-map.no-video")}</P>
			) : (
				Array.from({ length: 3 }).map((_, i) => (
					<MoviePathItem.Loader key={i} />
				))
			)}
			<AddMovieVideoFooter slug={slug} />
		</Modal>
	);
};
