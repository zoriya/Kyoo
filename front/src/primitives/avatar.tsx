import AccountCircle from "@material-symbols/svg-400/rounded/account_circle-fill.svg";
import { Image as EImage } from "expo-image";
import type { ComponentType } from "react";
import { Platform, View, type ViewProps, type ViewStyle } from "react-native";
import { withUniwind } from "uniwind";
import { useToken } from "~/providers/account-context";
import { cn } from "~/utils";
import { Icon } from "./icons";
import { Skeleton } from "./skeleton";
import { P } from "./text";

const Img = withUniwind(EImage);

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

export const Avatar = <AsProps = ViewProps>({
	src,
	account,
	alt,
	placeholder,
	className,
	placeholderClassName,
	style,
	as,
	...props
}: {
	src?: string;
	// fetch the logo of this account (via its own server & token) instead of `src`
	account?: { id: string; apiUrl: string; token: string | null } | null;
	alt?: string;
	placeholder?: string;
	className?: string;
	placeholderClassName?: string;
	style?: ViewStyle;
	as?: ComponentType<AsProps>;
} & AsProps) => {
	const Container = as ?? View;
	const ctx = useToken();
	const apiUrl = account?.apiUrl || ctx.apiUrl;
	const authToken = account ? account.token : ctx.authToken;
	if (account) src = "/auth/users/me/logo";
	return (
		<Container
			className={cn("h-6 w-6 overflow-hidden rounded-full", className)}
			style={
				placeholder
					? { backgroundColor: stringToColor(placeholder), ...style }
					: style
			}
			{...(props as AsProps)}
		>
			{placeholder && (
				<P
					className={cn(
						"text-center text-slate-200 dark:text-slate-200",
						placeholderClassName,
					)}
				>
					{placeholder[0]}
				</P>
			)}
			{src && (
				<Img
					source={{
						uri: src.startsWith("http") ? src : `${apiUrl}${src}`,
						// use cookies on web to allow `img` to make the call instead of js
						// (cookies only hold the selected account's token)
						headers:
							!src.startsWith("http") &&
							authToken &&
							(Platform.OS !== "web" || authToken !== ctx.authToken)
								? { Authorization: `Bearer ${authToken}` }
								: undefined,
						// `/me` urls are the same for every account of a server
						cacheKey: account
							? `${apiUrl}/auth/users/${account.id}/logo`
							: undefined,
					}}
					contentFit="cover"
					accessibilityLabel={alt}
					className="absolute inset-0 bg-slate-200 dark:bg-slate-200"
				/>
			)}
			{!src && !placeholder && (
				<Icon
					icon={AccountCircle}
					className="fill-slate-200 dark:fill-slate-200"
				/>
			)}
		</Container>
	);
};

Avatar.Loader = ({ className, ...props }: { className?: string }) => {
	return (
		<Skeleton variant="round" className={cn("h-6 w-6", className)} {...props} />
	);
};
