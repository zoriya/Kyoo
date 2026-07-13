import { useEffect, useRef } from "react";
import { useEvent, usePlayer } from "react-native-omni";
import { useAccount } from "~/providers/account-context";
import { useFetch } from "~/query";
import { Info } from "../info";

// Delay before selecting a track: the player needs a moment to initialise its
// track list after a new episode loads.
const SELECT_DELAY = 1000;
// Delay before releasing the restore guard, a bit longer than SELECT_DELAY so the
// change event triggered by our own selection doesn't overwrite the preference.
const RELEASE_DELAY = 1500;

const scheduleRestore = (
	restoring: { current: boolean },
	select?: () => void,
) => {
	const selectId = select ? setTimeout(select, SELECT_DELAY) : undefined;
	const releaseId = setTimeout(() => {
		restoring.current = false;
	}, RELEASE_DELAY);
	return () => {
		if (selectId) clearTimeout(selectId);
		clearTimeout(releaseId);
	};
};

// When the video change, try to persist the subtitle/audio language.
export const useLanguagePreference = (
	slug: string,
	originalAudio?: string | null,
) => {
	const player = usePlayer();
	const { data } = useFetch(Info.infoQuery(slug));
	const account = useAccount();

	const audios = data?.audios;
	const audioPref = useRef(account?.claims.settings.audioLanguage ?? "default");
	const audioIdx = useRef(-1);
	const restoringAudio = useRef(false);

	useEvent("audioTrackChange", () => {
		if (restoringAudio.current || !audios?.length) return;
		const idx = player.audios.findIndex((x) => x.selected);
		if (idx === -1 || !audios[idx]) return;
		audioIdx.current = idx;
		audioPref.current = audios[idx].language ?? audioPref.current;
	});
	useEffect(() => {
		if (!audios?.length) return;
		restoringAudio.current = true;
		const original = audioPref.current === "original";
		const lang = original ? originalAudio : audioPref.current;
		let audRet = audios.findIndex(
			audioPref.current === "default"
				? (x) => x.isDefault
				: (x) => x.language === lang,
		);
		if (audRet === -1) audRet = audioIdx.current;
		// "original" is wanted but the show's original language hasn't loaded yet
		// (it comes from a separate query): keep the guard up and wait for the next
		// run instead of resolving against an undefined language.
		if (audRet === -1 && original && originalAudio === undefined) return;
		if (audRet >= 0) audioIdx.current = audRet;
		// we need to wait for player to init audio list before we can select it
		return scheduleRestore(restoringAudio, () => {
			if (audRet === -1) return;
			const track = player.audios[audRet];
			if (track) player.selectAudio(track);
		});
	}, [player, audios, originalAudio]);

	const subtitles = data?.subtitles;
	const subPref = useRef({
		idx: account?.claims.settings.subtitleLanguage === null ? null : -1,
		lang: account?.claims.settings.subtitleLanguage,
		forced: false,
	});
	const restoringSub = useRef(false);
	useEvent("subtitleChange", (s) => {
		if (restoringSub.current || !subtitles?.length) return;
		if (!s) {
			subPref.current = { idx: null, lang: null, forced: false };
			return;
		}
		const idx = player.subtitles.findIndex((x) => x.selected);
		if (idx === -1 || !subtitles[idx]) return;
		subPref.current = {
			idx,
			lang: subtitles[idx].language,
			forced: subtitles[idx].isForced,
		};
	});
	useEffect(() => {
		if (!subtitles?.length) return;
		restoringSub.current = true;
		// subtitles are disabled: don't force any track, just hold the guard so the
		// player auto-enabling one on load doesn't overwrite the preference.
		if (subPref.current.idx === null) return scheduleRestore(restoringSub);
		let subRet = subtitles.findIndex(
			subPref.current.lang === "default"
				? (x) => x.isDefault
				: (x) =>
						x.language === subPref.current.lang &&
						x.isForced === subPref.current.forced,
		);
		if (subRet === -1) subRet = subPref.current.idx;
		if (subRet === -1) return scheduleRestore(restoringSub);
		subPref.current.idx = subRet;
		return scheduleRestore(restoringSub, () => {
			const track = player.subtitles[subRet];
			if (track) player.selectSubtitle(track);
		});
	}, [player, subtitles]);
};
