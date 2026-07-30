import { HomePage } from "~/ui/home";
import { MeasureTabBar } from "~/ui/mini-player";

export { ErrorBoundary } from "~/ui/error-boundary";

export default function Home() {
	return (
		<>
			<HomePage />
			<MeasureTabBar />
		</>
	);
}
