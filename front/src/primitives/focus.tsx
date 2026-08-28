import type { ComponentProps, RefObject } from "react";
import { TVFocusGuideView, type View } from "react-native";
import { withUniwind } from "uniwind";

const Guide = withUniwind(TVFocusGuideView);

export type FocusGroupProps = Omit<
	ComponentProps<typeof Guide>,
	"destinations"
> & {
	// The view the focus jumps to when it enters the group from a direction where
	// nothing is focusable. Handy for rows that can be empty (a loading list) so
	// the dpad doesn't dead-end on them.
	destination?: RefObject<View | null>;
};

// A container the platform focus engine knows about. `autoFocus` is the one that
// matters for the tv: leaving a row and coming back puts the focus on the card
// that had it, which is what every leanback app does. Careful with `trapFocus*`,
// a trapped direction refuses to let the focus in through it as much as out.
export const FocusGroup = ({ destination, ...props }: FocusGroupProps) => {
	return (
		<Guide
			destinations={destination?.current ? [destination.current] : undefined}
			{...props}
		/>
	);
};

// A screen has to open with something already selected: a remote has no pointer
// to start from, and left to itself the focus finder picks whatever happens to
// sit closest to a corner. react-native-tvos hands the initial focus to whoever
// asks for it, so exactly one element per screen should.
export const preferFocus = (prefer: boolean | null | undefined = true) =>
	prefer ? { hasTVPreferredFocus: true } : {};
