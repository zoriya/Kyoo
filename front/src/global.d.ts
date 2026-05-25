declare module "*.css" {
	const content: string;
	export default content;
}

declare module "*.svg" {
	import type React from "react";
	import type { SvgProps } from "react-native-svg";

	const content: React.FC<SvgProps>;
	export default content;
}
