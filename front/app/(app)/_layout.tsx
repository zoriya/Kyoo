import { Slot } from "expo-router";
import { ErrorConsumer } from "~/providers/error-consumer";

export default function Layout() {
	return (
		<ErrorConsumer scope="app">
			<Slot />
		</ErrorConsumer>
	);
}
