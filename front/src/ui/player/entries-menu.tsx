import { SideMenu } from "~/primitives";
import { EntryList } from "~/ui/details/season";
import { useQueryState } from "~/utils";

export const EntriesMenu = ({
	isOpen,
	onClose,
	showSlug,
	season,
	currentEntrySlug,
	setStart,
}: {
	isOpen: boolean;
	onClose: () => void;
	showSlug: string;
	season: string | number;
	currentEntrySlug?: string;
	setStart: (start: string | undefined) => void;
}) => {
	const [, setSlug] = useQueryState<string>("slug", undefined!);

	return (
		<SideMenu isOpen={isOpen} onClose={onClose} containerClassName="bg-card">
			<EntryList
				slug={showSlug}
				season={season}
				currentEntrySlug={currentEntrySlug}
				onPlay={(slug) => {
					setStart(undefined);
					setSlug(slug);
					onClose();
				}}
			/>
		</SideMenu>
	);
};
