import { Text, View } from "react-native";
import { useYoshiki } from "yoshiki/native";

export default function MyApp() {
	const { css } = useYoshiki();

	return (
		<View
			{...css({
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				minHeight: "100%",
			})}
		>
			<Text>Hello from One</Text>
		</View>
	);
}
