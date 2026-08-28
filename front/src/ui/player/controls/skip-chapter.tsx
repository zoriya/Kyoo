import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePlayer, usePlayerState } from "react-native-omni";
import type { Chapter } from "~/models";
import { Button } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { useFetch } from "~/query";
import { Info } from "~/ui/info";
import { cn, useQueryState } from "~/utils";
import { seekPlayerTo } from "../imperative";

export const SkipChapterButton = ({
	seekEnd,
	chapters,
	isVisible,
	className,
}: {
	seekEnd: () => void;
	chapters: Chapter[];
	isVisible: boolean;
	className?: string;
}) => {
	const { t } = useTranslation();
	const account = useAccount();
	const [slug] = useQueryState<string>("slug", undefined!);
	const { data } = useFetch(Info.infoQuery(slug));
	const lastAutoSkippedChapter = useRef<number | null>(null);

	const player = usePlayer();
	const progress = usePlayerState("currentTime");

	const chapter = chapters.find(
		(chapter) => chapter.startTime <= progress && progress < chapter.endTime,
	);

	const behavior =
		(chapter &&
			chapter.type !== "content" &&
			account?.claims.settings.chapterSkip[chapter.type]) ||
		"showSkipButton";
	const shouldAutoSkip =
		behavior === "autoSkip" ||
		(behavior === "autoSkipExceptFirstAppearance" && !chapter!.firstAppearance);

	// delay credits appearance by a few seconds, we want to make sure it doesn't
	// show on top of the end of the serie. it's common for the end credits music
	// to start playing on top of the episode also.
	const start = chapter
		? chapter.startTime + +(chapter.type === "credits") * 4
		: Infinity;

	useEffect(() => {
		if (
			chapter &&
			shouldAutoSkip &&
			progress >= start &&
			lastAutoSkippedChapter.current !== chapter.startTime
		) {
			lastAutoSkippedChapter.current = chapter.startTime;
			if (
				data?.durationSeconds &&
				data.durationSeconds <= chapter.endTime + 3
			) {
				return seekEnd();
			}
			seekPlayerTo(player, chapter.endTime);
		}
	}, [chapter, progress, shouldAutoSkip, start, data, player, seekEnd]);

	if (!chapter || chapter.type === "content" || behavior === "disabled")
		return null;
	if (!isVisible && progress >= start + 8) return null;

	return (
		<Button
			onPress={() => {
				if (!chapter) return;
				if (
					data?.durationSeconds &&
					data.durationSeconds <= chapter.endTime + 3
				) {
					return seekEnd();
				}
				seekPlayerTo(player, chapter.endTime);
			}}
			className={cn("z-20 bg-slate-900/70 px-4 py-2", className)}
			// the label is the button's own, so it lights up with it: a child of a
			// pressable cannot read the focus off its parent on native.
			textClassName="text-slate-300 dark:text-slate-300"
			text={t(`player.chapters.skip`, { type: chapter.type })}
		/>
	);
};
