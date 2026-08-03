import type { OmniPlayer, Source } from "react-native-omni";

// react-compiler consider every hook's return as frozen, so
// `usePlayer().muted = false` is illegal for react-compiler.
// using functions like this is a workaround to keep react-compiler enabled

export const setPlayerSource = (
	player: OmniPlayer,
	source: Source | undefined,
) => {
	player.source = source;
};

export const setPlayerMuted = (player: OmniPlayer, muted: boolean) => {
	player.muted = muted;
};

export const setPlayerVolume = (player: OmniPlayer, volume: number) => {
	player.volume = volume;
};

export const seekPlayerTo = (player: OmniPlayer, time: number) => {
	player.currentTime = time;
};
