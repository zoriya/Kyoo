import * as Dialog from "@radix-ui/react-dialog";
import { View, type ViewProps } from "react-native";
import type { FocusGroupProps, FocusTrapProps, TVEvent } from "./focus";

export const useTVEventHandler = (_handler: (event: TVEvent) => void) => {};

export const FocusGroup = ({
	autoFocus: _autoFocus,
	trapFocusUp: _up,
	trapFocusDown: _down,
	trapFocusLeft: _left,
	trapFocusRight: _right,
	...props
}: FocusGroupProps) => {
	return <View {...(props as ViewProps)} />;
};

export const FocusTrap = ({ onBack, title, ...props }: FocusTrapProps) => {
	return (
		<Dialog.Root
			open
			onOpenChange={(open) => {
				if (!open) onBack?.();
			}}
		>
			<Dialog.Content
				aria-describedby={undefined}
				style={{ display: "contents" }}
			>
				{title && <Dialog.Title className="sr-only">{title}</Dialog.Title>}
				<View {...(props as ViewProps)} />
			</Dialog.Content>
		</Dialog.Root>
	);
};
