import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { usePlayerState } from "react-native-omni";
import { Spinner } from "~/primitives";

export default function Remote() {
	const source = usePlayerState("source");
	const slug = source?.castId?.match(/\/videos\/([^/?]+)/)?.[1];

	// on a cold start the media comes from the receiver, which takes a moment to reach
	// us. don't stay stuck on the spinner if it never does (nothing playing anymore).
	const [gaveUp, setGaveUp] = useState(false);
	useEffect(() => {
		const timeout = setTimeout(() => setGaveUp(true), 10_000);
		return () => clearTimeout(timeout);
	}, []);
	if (gaveUp) return <Redirect href="/" />;

	if (slug) return <Redirect href={`/watch/${slug}`} />;
	return (
		<View className="flex-1 items-center justify-center bg-black">
			<Spinner />
		</View>
	);
}
