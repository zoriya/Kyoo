import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { Portal } from "react-native-teleport";
import { cn } from "~/utils";
import { Button } from "./button";
import { FocusTrap } from "./focus";
import { Heading, P } from "./text";

export type AlertOptions = {
	title: string;
	message?: string;
	buttons?: {
		text: string;
		style?: "default" | "cancel" | "destructive";
		onPress?: () => void;
	}[];
	align?: "center" | "left";
};

const AlertContext = createContext<(alert: AlertOptions) => void>(() => {
	throw new Error("useAlert used outside of an AlertProvider");
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
	const [alerts, setAlerts] = useState<(AlertOptions & { id: number })[]>([]);
	const nextId = useRef(0);
	const show = useCallback(
		(alert: AlertOptions) =>
			setAlerts((x) => [...x, { ...alert, id: nextId.current++ }]),
		[],
	);

	return (
		<AlertContext.Provider value={show}>
			{children}
			{alerts.map(({ id, ...alert }) => (
				<Portal key={id} hostName="root" style={{ pointerEvents: "auto" }}>
					<AlertDialog
						{...alert}
						close={() => setAlerts((x) => x.filter((a) => a.id !== id))}
					/>
				</Portal>
			))}
		</AlertContext.Provider>
	);
};

const AlertDialog = ({
	title,
	message,
	buttons: btns,
	align = "center",
	close,
}: AlertOptions & { close: () => void }) => {
	const { t } = useTranslation();
	const buttons = btns ?? [{ text: t("misc.close"), style: "cancel" }];
	const cancel = buttons.find((x) => x.style === "cancel");
	const dismiss = () => {
		close();
		cancel?.onPress?.();
	};

	return (
		<FocusTrap onBack={dismiss} className="absolute inset-0">
			<Pressable
				className="flex-1 cursor-default! items-center justify-center bg-black/60 px-4"
				onPress={dismiss}
				tabIndex={-1}
				focusable={false}
			>
				<Pressable
					className="w-full max-w-md cursor-default! rounded-md bg-background"
					onPress={(e) => e.preventDefault()}
					tabIndex={-1}
					focusable={false}
				>
					<View
						className={cn("gap-2 p-6", align === "center" && "items-center")}
					>
						<Heading className={cn(align === "center" && "text-center")}>
							{title}
						</Heading>
						{message && (
							<P className={cn(align === "center" && "text-center")}>
								{message}
							</P>
						)}
					</View>
					<View className="flex-row flex-wrap justify-end gap-2 p-4">
						{buttons.map((button, i) => (
							<Button
								key={i}
								text={button.text}
								hasTVPreferredFocus={cancel ? button === cancel : i === 0}
								onPress={() => {
									close();
									button.onPress?.();
								}}
								className={cn(
									button.style === "cancel" && "border-transparent",
									button.style === "destructive" &&
										"border-red-700 highlighted:bg-red-700",
								)}
							/>
						))}
					</View>
				</Pressable>
			</Pressable>
		</FocusTrap>
	);
};
