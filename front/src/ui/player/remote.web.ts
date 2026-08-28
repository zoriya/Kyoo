import type { RemoteKey } from "./remote";

// The web player has `useKeyboard` for this, on the document rather than on a
// remote.
export const useRemote = (_handler: (key: RemoteKey) => void) => {};
