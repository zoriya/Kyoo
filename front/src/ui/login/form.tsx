import type { ReactNode } from "react";
import { ImageBackground, ScrollView, View } from "react-native";
import Svg, { Path, type SvgProps } from "react-native-svg";
import { min, px, type Stylable, useYoshiki, vh } from "yoshiki/native";
import { ts } from "~/primitives";

const SvgBlob = (props: SvgProps) => {
	const { css, theme } = useYoshiki();

	return (
		<View {...css({ width: min(vh(90), px(1200)), aspectRatio: 5 / 6 }, props)}>
			<Svg width="100%" height="100%" viewBox="0 0 500 600">
				<Path
					d="M459.7 0c-20.2 43.3-40.3 86.6-51.7 132.6-11.3 45.9-13.9 94.6-36.1 137.6-22.2 43-64.1 80.3-111.5 88.2s-100.2-13.7-144.5-1.8C71.6 368.6 35.8 414.2 0 459.7V0h459.7z"
					fill={theme.background}
				/>
			</Svg>
		</View>
	);
};

export const FormPage = ({
	children,
	apiUrl,
	...props
}: { children: ReactNode; apiUrl?: string } & Stylable) => {
	const { css } = useYoshiki();

	return (
		<ImageBackground
			source={{ uri: `${apiUrl ?? ""}/api/shows/random/thumbnail` }}
			{...css({
				flexDirection: "row",
				flexGrow: 1,
				flexShrink: 1,
				backgroundColor: (theme) => theme.dark.background,
			})}
		>
			<SvgBlob {...css({ position: "absolute", top: 0, left: 0 })} />
			<ScrollView
				{...css({
					paddingRight: ts(3),
				})}
			>
				<View
					{...css(
						{
							maxWidth: px(600),
							backgroundColor: (theme) => theme.background,
							borderBottomRightRadius: ts(25),
							paddingBottom: ts(5),
							paddingLeft: ts(3),
						},
						props,
					)}
				>
					{children}
				</View>
			</ScrollView>
		</ImageBackground>
	);
};
