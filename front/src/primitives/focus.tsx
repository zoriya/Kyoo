import type { ComponentProps, RefObject } from "react";
import { Platform, TVFocusGuideView, type View } from "react-native";
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
// The prop on its own is not enough: android reads it while it is building the
// view and never looks at it again, and a screen that waits on a query is not
// on screen yet by then. So ask by hand as well, on every layout until one of
// the asks lands — a request made before the view is placed is dropped on the
// floor and nothing says it was.
const claimed = new WeakSet<object>();
export const preferFocus = (prefer: boolean | null | undefined = true) => {
	// A screen only opens with something selected where there is no pointer to
	// select with: on a phone this would put a highlight on a button nobody
	// touched, and android would happily give it the focus in touch mode.
	if (!prefer || !Platform.isTV) return {};
	const view: { current: object | null } = { current: null };
	const claim = () => {
		if (!view.current || claimed.has(view.current)) return;
		requestFocus(view.current);
	};
	return {
		hasTVPreferredFocus: true,
		ref: (v: object | null) => {
			view.current = v;
		},
		onLayout: () => {
			claim();
			// a list keeps moving for a while after its last layout, and the ask that
			// lands is the one made once it stopped.
			setTimeout(claim, 300);
		},
		// it landed, and from here the selection is the user's to move.
		onFocus: () => {
			if (view.current) claimed.add(view.current);
		},
	};
};

// Hands the focus back to a view on demand. Closing an overlay unmounts whatever
// was selected inside it, and android has nowhere to fall back to: the dpad ends
// up selecting nothing at all until it walks into something by chance.
export const requestFocus = (view: unknown) => {
	const v = view as {
		requestTVFocus?: () => void;
		focus?: () => void;
	} | null;
	if (v?.requestTVFocus) return v.requestTVFocus();
	// A text input is not a view and has no `requestTVFocus`; `focus` is the one
	// it answers to, and it brings the keyboard up with it. That is what you want
	// from a couch, where there is no pointer to put the caret with and nothing on
	// the screen to do but type — and not what you want in a hand, where it covers
	// half the page before you have decided to type anything.
	if (Platform.isTV) v?.focus?.();
};
