import type { ViewProps } from "react-native";

export const hiddenIfNoJs: ViewProps = {
	style: { $$css: true, noJs: "noJsHidden" } as any,
};

export const HiddenIfNoJs = () => (
	<noscript>
		<style>
			{`
				.noJsHidden {
					display: none;
				}
			`}
		</style>
	</noscript>
);
