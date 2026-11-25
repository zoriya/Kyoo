import { AddPage } from "~/ui/admin/add";
import { NeedPermission } from "~/ui/need-permission";

export { ErrorBoundary } from "~/ui/error-boundary";

export default function AddRoute() {
	return (
		<NeedPermission permission="scanner.add">
			<AddPage allowLibrary={false} videos={[]} />
		</NeedPermission>
	);
}
