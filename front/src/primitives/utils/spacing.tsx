import { Platform } from "react-native";

// Mirror of --ui-scale in global.css — see the comment there. Uniwind bakes rem
// at build time, so the css half of the scale has to be spelled out as vars;
// this is the same factor for the dp values we write straight into .ts files,
// which no className goes through.
export const uiScale = Platform.isTV ? 0.75 : 1;

export const ts = (spacing: number) => {
	return spacing * 4 * uiScale;
};
