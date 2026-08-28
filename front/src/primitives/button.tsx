import type {
	ComponentProps,
	ComponentType,
	ReactElement,
	ReactNode,
	Ref,
} from "react";
import type { Falsy, PressableProps, View } from "react-native";
import { cn } from "~/utils";
import { Icon } from "./icons";
import { PressableFeedback } from "./links";
import { P } from "./text";

export const Button = <AsProps = PressableProps>({
	text,
	icon,
	ricon,
	left,
	right,
	disabled,
	as,
	ref,
	children,
	className,
	textClassName,
	...props
}: {
	disabled?: boolean | null;
	text?: string;
	icon?: ComponentProps<typeof Icon>["icon"] | Falsy;
	left?: ReactElement | Falsy;
	ricon?: ComponentProps<typeof Icon>["icon"] | Falsy;
	right?: ReactElement | Falsy;
	children?: ReactNode;
	ref?: Ref<View>;
	className?: string;
	textClassName?: string;
	as?: ComponentType<AsProps>;
} & AsProps) => {
	const Container = as ?? PressableFeedback;
	return (
		<Container
			ref={ref as any}
			disabled={disabled}
			className={cn(
				"flex-row items-center justify-center overflow-hidden",
				"rounded-4xl border-3 border-accent p-1 px-6 outline-0",
				disabled && "border-slate-600",
				"group highlighted:bg-accent",
				"highlighted:outline-3 highlighted:outline-accent",
				className,
			)}
			{...(props as AsProps)}
		>
			{/* the label has to stay readable once the accent slides in, and a child
			    cannot match its parent's `:focus` — see item-grid for the why. */}
			{({ focused, hovered }: { focused?: boolean; hovered?: boolean }) => {
				const highlighted = focused || hovered || undefined;
				return (
					<>
						{icon && (
							<Icon
								icon={icon}
								data-highlighted={highlighted}
								className="mx-2 data-highlighted:fill-slate-200"
							/>
						)}
						{left}
						{text && (
							<P
								data-highlighted={highlighted}
								className="text-center data-highlighted:text-slate-200"
							>
								{text}
							</P>
						)}
						{children}
						{right}
						{ricon && (
							<Icon
								icon={ricon}
								data-highlighted={highlighted}
								className="mx-2 data-highlighted:fill-slate-200"
							/>
						)}
					</>
				);
			}}
		</Container>
	);
};
