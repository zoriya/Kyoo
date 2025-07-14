import Star from "@material-symbols/svg-400/rounded/star-fill.svg";
import { View } from "react-native";
import { rem, useYoshiki } from "yoshiki/native";
import { type Breakpoint, Icon, P, Skeleton, ts } from "~/primitives";

export const Rating = ({
	rating,
	color,
}: {
	rating: number | null;
	color: Breakpoint<string>;
}) => {
	const { css } = useYoshiki();

	return (
		<View {...css({ flexDirection: "row", alignItems: "center" })}>
			<Icon icon={Star} color={color} {...css({ marginRight: ts(0.5) })} />
			<P {...css({ color, verticalAlign: "middle" })}>
				{rating ? rating / 10 : "??"} / 10
			</P>
		</View>
	);
};

Rating.Loader = ({ color }: { color: Breakpoint<string> }) => {
	const { css } = useYoshiki();

	return (
		<View {...css({ flexDirection: "row", alignItems: "center" })}>
			<Icon icon={Star} color={color} {...css({ marginRight: ts(0.5) })} />
			<Skeleton {...css({ width: rem(2) })} />
		</View>
	);
};
