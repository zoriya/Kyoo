import type { RefObject } from "react";
import type { View } from "react-native";
import { SideMenu } from "~/primitives";
import { EntryList } from "~/ui/details/season";

export const EntriesMenu = ({
	isOpen,
	onClose,
	showSlug,
	season,
	currentEntrySlug,
	returnFocus,
}: {
	isOpen: boolean;
	onClose: () => void;
	showSlug: string;
	season: string | number;
	currentEntrySlug?: string;
	returnFocus?: RefObject<View | null>;
}) => {
	return (
		<SideMenu
			isOpen={isOpen}
			onClose={onClose}
			returnFocus={returnFocus}
			containerClassName="bg-card"
		>
			<EntryList
				slug={showSlug}
				season={season}
				currentEntrySlug={currentEntrySlug}
			/>
		</SideMenu>
	);
};
