import CastConnected from "@material-symbols/svg-400/rounded/cast_connected-fill.svg";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { usePlayerState } from "react-native-omni";
import { Icon, P } from "~/primitives";

export const CastingScreen = ({ name }: { name?: string }) => {
	const { t } = useTranslation();
	const castStatus = usePlayerState("castStatus");

	if (castStatus !== "connected" && castStatus !== "connecting") return null;

	return (
		<View className="absolute inset-0 items-center justify-center gap-3 bg-black p-8">
			<Icon icon={CastConnected} className="h-16 w-16 fill-white" />
			<P className="text-center font-semibold text-white text-xl">
				{castStatus === "connecting"
					? t("player.casting.connecting")
					: t("player.casting.playing")}
			</P>
			{name ? <P className="text-center text-white/70">{name}</P> : null}
		</View>
	);
};
