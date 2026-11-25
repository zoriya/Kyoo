import { MatchPage } from "~/ui/admin/match";
import { NeedPermission } from "~/ui/need-permission";

export { ErrorBoundary } from "~/ui/error-boundary";

export default function MatchRoute() {
	return (
		<NeedPermission permission="scanner.add">
			<MatchPage />
		</NeedPermission>
	);
}
