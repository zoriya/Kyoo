import type { ComponentProps } from "react";
import { TVFocusGuideView } from "react-native";
import { withUniwind } from "uniwind";

export const FocusGroup = withUniwind(TVFocusGuideView);
export type FocusGroupProps = ComponentProps<typeof FocusGroup>;
