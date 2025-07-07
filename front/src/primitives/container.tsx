import type { ComponentType } from "react";
import { View, type ViewProps } from "react-native";
import { percent, px, useYoshiki } from "yoshiki/native";

export const Container = <AsProps = ViewProps>({
	as,
	...props
}: { as?: ComponentType<AsProps> } & AsProps) => {
	const { css } = useYoshiki();

	const As = as ?? View;
	return (
		<As
			{...(css(
				{
					display: "flex",
					paddingHorizontal: px(15),
					alignSelf: "center",
					width: {
						xs: percent(100),
						sm: px(540),
						md: px(880),
						lg: px(1170),
					},
				},
				props,
			) as any)}
		/>
	);
};
