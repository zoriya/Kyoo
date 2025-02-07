import { Slot } from "one";
import { ErrorConsumer } from "~/providers/error-provider";

export default function Layout() {
	return (
		<ErrorConsumer scope="app">
			<Slot />
		</ErrorConsumer>
	);
}
