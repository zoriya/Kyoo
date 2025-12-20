import { useEffect, useRef } from "react";
import { useEvent, type VideoPlayer } from "react-native-video";
import { useAccount } from "~/providers/account-context";
import { useFetch } from "~/query";
import { Info } from "../info";

// When the video change, try to persist the subtitle/audio language.
export const useLanguagePreference = (player: VideoPlayer, slug: string) => {
	const { data } = useFetch(Info.infoQuery(slug));
	const account = useAccount();

	const audios = data?.audios;
	const aud = useRef({
		idx: -1,
		lang: account?.claims.settings.audioLanguage ?? null,
	});
	useEvent(player, "onAudioTrackChange", () => {
		const selected =
			audios?.[player.getAvailableTextTracks().findIndex((x) => x.selected)];
		if (!selected) return;
		aud.current = { idx: selected.index, lang: selected.language };
	});
	useEffect(() => {
		if (!audios) return;
		let audRet = audios.findIndex(
			aud.current.lang === "default"
				? (x) => x.isDefault
				: (x) => x.language === aud.current.lang,
		);
		if (audRet === -1) audRet = aud.current.idx;
		if (audRet !== -1) {
			// we need to wait for player to init audio list before we can select it
			setTimeout(() => {
				player.selectAudioTrack(player.getAvailableAudioTracks()[audRet]);
			}, 1000);
		}
	}, [player, audios]);

	const subtitles = data?.subtitles;
	const sub = useRef({
		idx: account?.claims.settings.subtitleLanguage === null ? null : -1,
		lang: account?.claims.settings.subtitleLanguage,
		forced: false,
	});
	useEffect(() => {
		if (!subtitles || sub.current.idx === null) return;
		let subRet = subtitles.findIndex(
			sub.current.lang === "default"
				? (x) => x.isDefault
				: (x) =>
						x.language === sub.current.lang &&
						x.isForced === sub.current.forced,
		);
		if (subRet === -1) subRet = sub.current.idx;
		if (subRet !== -1) {
			// we need to wait for player to init subs list before we can select it
			setTimeout(() => {
				player.selectTextTrack(player.getAvailableTextTracks()[subRet]);
			}, 1000);
		}
	}, [player, subtitles]);
};
