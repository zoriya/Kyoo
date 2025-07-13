import { HR as EHR } from "@expo/html-elements";
import { px, type Stylable, useYoshiki } from "yoshiki/native";
import { ts } from "./utils";

export const HR = ({
	orientation = "horizontal",
	...props
}: { orientation?: "vertical" | "horizontal" } & Stylable) => {
	const { css } = useYoshiki();

	return (
		<EHR
			{...css(
				[
					{
						opacity: 0.7,
						bg: (theme) => theme.overlay0,
						borderWidth: 0,
					},
					orientation === "vertical" && {
						width: px(1),
						height: "auto",
						marginY: ts(1),
						marginX: ts(2),
					},
					orientation === "horizontal" && {
						height: px(1),
						width: "auto",
						marginX: ts(1),
						marginY: ts(2),
					},
				],
				props,
			)}
		/>
	);
};
