import AccountCircle from "@material-symbols/svg-400/rounded/account_circle-fill.svg";
import { type ComponentType, forwardRef, type RefAttributes } from "react";
import { Image, type ImageProps, View, type ViewStyle } from "react-native";
import { px, type Stylable, useYoshiki } from "yoshiki/native";
import { Icon } from "./icons";
import { Skeleton } from "./skeleton";
import { P } from "./text";

const stringToColor = (string: string) => {
	let hash = 0;

	for (let i = 0; i < string.length; i += 1) {
		hash = string.charCodeAt(i) + ((hash << 5) - hash);
	}

	let color = "#";
	for (let i = 0; i < 3; i += 1) {
		const value = (hash >> (i * 8)) & 0xff;
		color += `00${value.toString(16)}`.slice(-2);
	}
	return color;
};

const AvatarC = forwardRef<
	View,
	{
		src?: string;
		alt?: string;
		size?: number;
		placeholder?: string;
		color?: string;
		fill?: boolean;
		as?: ComponentType<{ style?: ViewStyle } & RefAttributes<View>>;
	} & Stylable
>(function AvatarI(
	{ src, alt, size = px(24), color, placeholder, fill = false, as, ...props },
	ref,
) {
	const { css, theme } = useYoshiki();
	const col = color ?? theme.overlay0;

	// TODO: Support dark themes when fill === true
	const Container = as ?? View;
	return (
		<Container
			ref={ref}
			{...css(
				[
					{
						borderRadius: 999999,
						overflow: "hidden",
						height: size,
						width: size,
					},
					fill && {
						bg: col,
					},
					placeholder && {
						bg: stringToColor(placeholder),
					},
				],
				props,
			)}
		>
			{placeholder ? (
				<P
					{...css({
						marginVertical: 0,
						lineHeight: size,
						textAlign: "center",
					})}
				>
					{placeholder[0]}
				</P>
			) : (
				<Icon
					icon={AccountCircle}
					size={size}
					color={fill ? col : theme.colors.white}
				/>
			)}
			<Image
				resizeMode="cover"
				source={{ uri: src, width: size, height: size }}
				alt={alt}
				width={size}
				height={size}
				{...(css({ position: "absolute" }) as ImageProps)}
			/>
		</Container>
	);
});

const AvatarLoader = ({ size = px(24), ...props }: { size?: number }) => {
	const { css } = useYoshiki();

	return (
		<Skeleton
			variant="round"
			{...css(
				{
					height: size,
					width: size,
				},
				props,
			)}
		/>
	);
};

export const Avatar = Object.assign(AvatarC, { Loader: AvatarLoader });
