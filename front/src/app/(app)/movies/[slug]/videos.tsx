import { MovieVideosModal } from "~/ui/admin/videos-modal/movie-modal";
import { NeedPermission } from "~/ui/need-permission";

export { ErrorBoundary } from "~/ui/error-boundary";

export default function VideosRoute() {
	return (
		<NeedPermission permission="core.write">
			<MovieVideosModal />
		</NeedPermission>
	);
}
