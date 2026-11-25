import { MovieRemapModal } from "~/ui/admin";
import { NeedPermission } from "~/ui/need-permission";

export { ErrorBoundary } from "~/ui/error-boundary";

export default function RemapRoute() {
	return (
		<NeedPermission permission="scanner.add">
			<MovieRemapModal />
		</NeedPermission>
	);
}
