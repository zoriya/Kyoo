/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import * as RSelect from "@radix-ui/react-select";
import { ReactNode, forwardRef } from "react";
import { Icon } from "./icons";
import Check from "@material-symbols/svg-400/rounded/check-fill.svg";
import ExpandMore from "@material-symbols/svg-400/rounded/expand_more-fill.svg";
import ExpandLess from "@material-symbols/svg-400/rounded/expand_less-fill.svg";
import { ContrastArea, SwitchVariant } from "./themes";
import { InternalTriger, YoshikiProvider } from "./menu.web";
import { Theme, px, useYoshiki as useNativeYoshiki } from "yoshiki/native";
import { useYoshiki } from "yoshiki";
import { PressableFeedback } from "./links";
import { P } from "./text";
import { focusReset, ts } from "./utils";

export const Select = ({
	children,
	label,
	value,
	onValueChange,
}: {
	children: ReactNode;
	label: string;
	value: string;
	onValueChange: (v: string) => void;
}) => {
	const { css } = useNativeYoshiki();

	return (
		<RSelect.Root value={value} onValueChange={onValueChange}>
			<RSelect.Trigger aria-label={label} asChild>
				<InternalTriger
					Component={PressableFeedback}
					ComponentProps={css({
						flexGrow: 0,
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						overflow: "hidden",
						p: ts(0.5),
						borderRadius: ts(5),
						borderColor: (theme) => theme.accent,
						borderWidth: ts(0.5),
						fover: {
							self: { bg: (theme: Theme) => theme.accent },
							text: { color: (theme: Theme) => theme.colors.white },
						},
					})}
				>
					<P {...css({ textAlign: "center" }, "text")}>{<RSelect.Value />}</P>
					<RSelect.Icon asChild>
						<Icon icon={ExpandMore} />
					</RSelect.Icon>
				</InternalTriger>
			</RSelect.Trigger>
			<ContrastArea mode="user">
				<SwitchVariant>
					<YoshikiProvider>
						{({ css }) => (
							<RSelect.Portal>
								<RSelect.Content
									{...css({
										bg: (theme) => theme.background,
										overflow: "auto",
										minWidth: "220px",
										borderRadius: "8px",
										boxShadow:
											"0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)",
										zIndex: 2,
										maxHeight: "calc(var(--radix-dropdown-menu-content-available-height) * 0.8)",
									})}
								>
									<RSelect.ScrollUpButton asChild>
										<Icon icon={ExpandLess} />
									</RSelect.ScrollUpButton>
									<RSelect.Viewport>{children}</RSelect.Viewport>
									<RSelect.ScrollDownButton asChild>
										<Icon icon={ExpandMore} />
									</RSelect.ScrollDownButton>
								</RSelect.Content>
							</RSelect.Portal>
						)}
					</YoshikiProvider>
				</SwitchVariant>
			</ContrastArea>
		</RSelect.Root>
	);
};

const Item = forwardRef<HTMLDivElement, { label: string; value: string }>(function Item(
	{ label, value, ...props },
	ref,
) {
	const { css, theme } = useYoshiki();
	const { css: nCss } = useNativeYoshiki();
	return (
		<>
			<style jsx global>{`
				[data-highlighted] {
					background: ${theme.variant.accent};
				}
			`}</style>
			<RSelect.Item
				ref={ref}
				value={value}
				{...css(
					{
						display: "flex",
						alignItems: "center",
						paddingLeft: "35px",
						paddingRight: "25px",
						height: "32px",
						color: (theme) => theme.paragraph,
						borderRadius: "4px",
						position: "relative",
						userSelect: "none",
						...focusReset,
					},
					props as any,
				)}
			>
				<RSelect.ItemText {...css({ color: (theme) => theme.paragraph })}>{label}</RSelect.ItemText>
				<RSelect.ItemIndicator asChild>
					<InternalTriger
						Component={Icon}
						icon={Check}
						ComponentProps={nCss({
							position: "absolute",
							left: 0,
							width: px(25),
							alignItems: "center",
							justifyContent: "center",
						})}
					/>
				</RSelect.ItemIndicator>
			</RSelect.Item>
		</>
	);
});
Select.Item = Item;
