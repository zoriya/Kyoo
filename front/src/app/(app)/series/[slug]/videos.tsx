import { VideosModal } from "~/ui/admin";
import { NeedPermission } from "~/ui/need-permission";

export { ErrorBoundary } from "~/ui/error-boundary";

export default function VideosRoute() {
	return (
		<NeedPermission permission="core.write">
			<VideosModal />
		</NeedPermission>
	);
}
