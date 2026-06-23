# Migrating the transcoder output from MPEG-TS to fMP4

This document explains the three ways we explored to switch the HLS segment
container from MPEG-TS (`.ts`) to fragmented MP4 (`.m4s`), what works and what
doesn't, and the trade-offs of each. All experiments were run with **ffmpeg
7.1** (the version shipped in Debian trixie, our production base image).

## Why this is hard: the lazy-window constraint

The transcoder does not transcode a file in one pass. It transcodes in
independent **lazy windows**: when a client requests a segment that no running
encoder is near, `stream.go::run()` spawns a *fresh* ffmpeg process starting at
the keyframe before that segment. Several such processes can exist at once, and
each is started at an arbitrary point in the file that we cannot predict in
advance.

Two hard requirements fall out of this:

1. **One init segment for the whole stream.** HLS fMP4 references a single
   initialization segment via one `#EXT-X-MAP:URI="…"` tag. Every media segment,
   no matter which lazy window produced it, must be decodable with that one init.

2. **Continuous timestamps across window boundaries.** Segment `N` (produced by
   window A) and segment `N+1` (possibly produced by an entirely different
   window B) must present a monotonically increasing timeline so playback and
   seeking are seamless and A/V stays in sync.

A third, easily-overlooked requirement is specific to our architecture:

3. **Deterministic, explicit segment boundaries.** Segment `N` always spans
   `keyframes[N] … keyframes[N+1]`. For the `Original`/copy quality these
   boundaries are the file's *native* (irregularly spaced) keyframes. Any two
   windows that both produce segment `N` must cut it at *exactly* the same place,
   byte-for-byte in time, or ABR switching and seeking break. Today this is
   achieved with the segment muxer's `-segment_times` (an explicit list of split
   points) plus `-segment_start_number`.

### How MPEG-TS satisfies all three today

MPEG-TS segments are self-describing (each carries its own PAT/PMT), so there is
no shared init file to mismatch (requirement 1 is moot). With `-copyts`, packets
keep their **absolute** presentation timestamps, so a segment from a window that
started at 30 s naturally carries PTS ≈ 30 s and stitches continuously after the
previous one (requirement 2). And `-f segment -segment_times …` gives exact,
explicit cut points (requirement 3).

fMP4 breaks requirement 1 (there *is* now a shared init) and, depending on the
muxer, requirement 2 (per-window timestamp rebasing). The whole migration is
about restoring those two without losing requirement 3.

---

## Background: what an fMP4 stream is made of

- **Init segment** (`init.mp4`): `ftyp` + `moov`. The `moov` holds the timescale,
  codec configuration (`avcC`/SPS/PPS, etc.), track metadata, the `mvex` defaults
  for fragments, and optionally an `edts`/`elst` **edit list**.
- **Media segments** (`*.m4s`): one or more `moof` + `mdat` pairs. The `moof`
  contains a `tfdt` box whose **`baseMediaDecodeTime`** positions the fragment on
  the decode timeline. For continuous playback `tfdt` must increase monotonically
  across segments.
- **`edts`/`elst` edit list** (in the init): remaps the media timeline for the
  player. An "empty edit" (`media_time = -1`) of duration *D* tells the player to
  insert *D* of blank timeline before the media — i.e. it encodes a start offset.

Two facts discovered during exploration drive everything below:

- **The edit list, when present, lives in the shared init** — so if ffmpeg bakes
  a window-specific offset into the `elst`, that offset poisons the init for
  every other window.
- **`-copyts` does *not* guarantee absolute `tfdt`.** Whether `tfdt` ends up
  absolute or rebased-to-zero depends on which muxer writes the segment.

---

## Approach A — `-f hls -hls_segment_type fmp4`

Let ffmpeg's HLS muxer emit fMP4 natively. Segments come out as
`styp + sidx + moof + mdat` (already the right shape — no stripping needed), and
the init is written separately via `-hls_fmp4_init_filename`.

### What we found

- **The init always contains an `elst`, even for a window starting at t=0.** But
  the *contents* differ in exactly the way that matters:

  | window start | `elst` empty-edit duration |
  |--------------|----------------------------|
  | t = 0        | `seg_dur=83`  (≈ 7 ms — benign b-frame composition delay) |
  | t = 28 s     | `seg_dur=28000` (28 s — poison offset) |

  The structure is identical; only the empty-edit duration encodes the window's
  start offset. So the original migration notes were right that non-zero windows
  poison the init, and the user's intuition was right that the **t=0 window's
  init is clean enough** to reuse.

- **The HLS muxer rebases each segment's `tfdt` to 0** (per window). As with
  Approach B, this must be patched to the absolute decode time.

- **Proven to work end-to-end** *if* you (a) use a t=0-style clean init and
  (b) patch every segment's `tfdt`: a 16-segment playlist whose segment 15 was
  produced by a *separate* ffmpeg process starting at 28 s decoded as 768/768
  frames with a perfectly monotonic PTS timeline and no errors.

### The blocker: no explicit segment boundaries

`-f hls` only supports `-hls_time` (a *target* duration) and splits at the first
keyframe at or after that target. **It has no equivalent of `-segment_times`** —
you cannot hand it an explicit list of cut points. That violates requirement 3:

- For transcoded qualities you can force a regular GOP and live with regular
  segments (this is what nightfall does, see Approach C).
- For the **`Original`/copy quality** we must cut at the file's *native,
  irregularly spaced* keyframes. The HLS muxer cannot be told where those are, so
  two windows can disagree on where segment `N` ends, and the segment-index ↔
  time-range mapping that the whole lazy architecture relies on falls apart.

A second, smaller friction: `-f hls` does not support `-segment_list pipe:1`. The
current `run()` learns a segment is finished by reading filenames off ffmpeg's
stdout pipe; with `-f hls` we'd instead have to watch the `.m3u8` or the segment
files appear on disk — a rewrite of the ready-detection path.

### Verdict
Technically workable for transcoded qualities (clean t=0 init + tfdt patch), but
**incompatible with the native-keyframe copy/transmux path** because it cannot
honor explicit cut points, and it forces a rewrite of segment-ready detection.

---

## Approach B — `-f segment -segment_format mp4` + `-segment_header_filename`

Keep the **exact** segmenting machinery we use today (`-f segment`,
`-segment_times`, `-segment_start_number`, `-segment_list pipe:1`, `-copyts`) and
only change the per-segment container:

```
-f segment -segment_format mp4 \
-segment_header_filename init.mp4 \
-segment_format_options movflags=frag_keyframe+empty_moov+default_base_moof+skip_trailer
```

`-segment_header_filename` makes the muxer write the shared init segment
(`ftyp + moov`) to its own file, and `skip_trailer` drops the per-file `mfra`, so
every media segment comes out as a clean `moof + mdat` pair. No box surgery on
the segments is needed — only a `tfdt` patch (below).

> An earlier iteration omitted `-segment_header_filename` and instead emitted
> self-contained segments (`ftyp+moov+sidx+moof+mdat+mfra`), extracting the init
> and stripping each segment by hand. `-segment_header_filename` (suggested in
> review) is cleaner: ffmpeg separates the moov natively and the segments need no
> stripping, so we trust the muxer's output instead of hand-parsing boxes.

### What we found

- **The init (`ftyp + moov`) is byte-identical across independent ffmpeg
  invocations**, for every stream type we tested:
  - copy video — md5 `496f820d` (header file), `4f190f81` (older embedded-moov)
  - transcoded x264 video — md5 `54e84930`
  - copy audio — md5 `c4cab1d4`

  So a single shared init is valid for the entire stream, including across lazy
  windows. (The original notes worried transcoded params might differ between
  windows; with fixed encoder settings they do not.)

- **No `edts`/`elst` is ever written.** The segment muxer does not emit an edit
  list at all. This is the single biggest advantage over Approach A: there is no
  window-specific offset that can poison the init, so the "which init does this
  segment belong to" problem simply does not exist.

- **`tfdt` is rebased to the window start.** A window starting at t=0 has
  absolute `tfdt` (seg N → N·segdur), but a window starting mid-file via `-ss`
  rebases its first segment to `tfdt = 0`. So for any non-zero lazy window the
  `tfdt` must be patched back to the absolute decode time. (Patching is a no-op
  for the t=0 window and the essential fix for the rest.)

- **Init generation is free and unambiguous.** The header the muxer writes via
  `-segment_header_filename` is byte-identical (md5 `496f820d`) to one produced
  by a short dedicated run, so the init can be generated on demand by a 0.5 s
  ffmpeg run for the case where the player asks for `#EXT-X-MAP` before any
  window has produced a segment.

- **Proven end-to-end:** a 16-segment playlist whose segment 15 came from a
  *separate* ffmpeg process — shared init + each segment `tfdt`-patched — decoded
  as 768/768 frames, monotonic PTS across the 29.96 s → 30.0 s window boundary,
  zero decode errors, HLS demuxer reporting the correct 32 s duration. Reproduced
  as a Go test in `src/mp4_test.go` (two independent windows, identical init,
  rebased-then-patched segment reads its correct absolute PTS).

### Per-segment processing required

For each segment we serve (done once, when the segment becomes ready): **patch**
the `tfdt` `baseMediaDecodeTime` to the absolute decode time
`round(keyframes.Get(segment) * timescale)`, where `timescale` is read once from
the init's `mdhd` (video and audio each have their own init/timescale). This is a
single integer overwrite; sample durations/offsets in `trun` are untouched, so
the patch cannot desync the media. No stripping is needed — `skip_trailer` +
`-segment_header_filename` already make the segments clean `moof + mdat`.

### Verdict
**Recommended.** It is the only approach that preserves our proven
`-segment_times` precise-cutting and `-segment_list pipe:1` ready-detection
unchanged, it produces an elst-free init that is automatically shared across all
windows, and it is validated end-to-end across a window boundary. The cost is a
small, deterministic per-segment byte rewrite.

---

## Approach C — a forked ffmpeg (Plex / Jellyfin / nightfall)

We checked whether the projects with custom ffmpeg builds have a patch that
solves this for free.

- **Plex / Jellyfin do not use lazy windows.** They run a single continuous
  transcode and **restart it from scratch on seek**, so they never reuse one init
  across independent offset windows — they sidestep the problem instead of
  solving it. jellyfin-ffmpeg currently has several *open* fMP4-HLS playback bugs
  (e.g. jellyfin-ffmpeg#413, jellyfin#16612), so it is not a model to copy here.

- **nightfall** (the one comparable lazy-window fMP4 transcoder) does *not* share
  one init. From `src/profiles/video.rs`:
  - `-hls_segment_type 1` (fMP4) with a **per-window init** filename
    `"{start_num}_init.mp4"`.
  - splits with **`-hls_time target_gop`** and forces a **regular GOP**
    (`-force_key_frames expr:gte(t,n_forced*target_gop)`) — i.e. fixed-size
    segments, never native-keyframe cuts.
  - for seek windows (`start_num > 0`) it adds
    `movflags=frag_custom+dash+delay_moov+frag_discont`, commented as needed "to
    reset the base decode ts to equal the earliest presentation timestamp."
  - the web layer serves the matching per-window init for each segment.

  This is the "per-window init files + dynamic `#EXT-X-MAP`" idea (Solution F in
  the old notes). It is strictly more complex than Approach B — it requires
  emitting multiple `#EXT-X-MAP` tags mid-playlist, routing each segment to its
  own init, and it gives up native-keyframe cutting — while solving a problem
  (requirement 1) that Approach B makes disappear entirely.

### Verdict
No reusable patch exists, and the one architecture worth borrowing (nightfall's
per-window inits) is more complex than Approach B with no benefit for us.

---

## Side-by-side

| | A: `-f hls` fmp4 | B: `-f segment` mp4 | C: per-window inits |
|---|---|---|---|
| Shared single init | only if forced t=0 init + neutralized `elst` | **yes, automatic, elst-free** | no (one per window) |
| Explicit `-segment_times` cuts | **no** (only `-hls_time`) | **yes (unchanged)** | no (regular GOP) |
| Native-keyframe copy quality | **broken** | **works** | not supported |
| `-segment_list pipe:1` ready detection | must rewrite (watch m3u8/files) | **unchanged** | must rewrite |
| Per-segment work | patch `tfdt` | patch `tfdt` (clean segments, no strip) | none (but per-window init + routing) |
| `tfdt` rebased per window | yes (patch) | yes (patch) | yes (`frag_discont`) |
| Playlist changes | `EXT-X-MAP` once | `EXT-X-MAP` once | `EXT-X-MAP` per window |
| End-to-end validated here | yes | yes | n/a |

## Recommendation

**Approach B.** It is the only option that keeps the lazy-window cutting and
ready-detection machinery exactly as-is, yields an elst-free init that is shared
across every window for free, and was validated end-to-end across a real window
boundary. The only per-segment work is a single `tfdt` shift, done once per
segment.

### Implementation (Approach B, as built)

1. `stream.go::run()` — swap `-segment_format mpegts` → `mp4` with
   `-segment_header_filename <init>` and `-segment_format_options
   movflags=frag_keyframe+empty_moov+default_base_moof+skip_trailer`. Each window
   rewrites the init with byte-identical content; segments come out as clean
   `moof+mdat`. Keep `-segment_times`, `-segment_start_number`,
   `-segment_list pipe:1`, `-copyts` untouched.
2. **Init** (`Stream.GetInit`): a warmup transcode is started from segment 0 on
   stream creation (`NewStream`), so the windows write the init via
   `-segment_header_filename` before the client asks for it. `GetInit` therefore
   just depends on `GetSegment(0)` and returns the init path — no dedicated
   ffmpeg process. If the client seeks far ahead, the warmup head sits idle and
   is reaped like any other lazy window.
3. **Segment post-processing** (`Stream.finalizeSegment`, run in the
   segment-ready goroutine, outside the heads lock — the file is unique per
   `(encoder, segment)`): the muxer rebases each window's `tfdt` to the window's
   first frame, which is the keyframe the window seeked to. So we add
   `keyframes.Get(start_segment) * timescale` to every fragment's `tfdt`. This is
   **window-independent**: any window that produces segment N yields the same
   `tfdt`, so segments from different windows stay continuous when stitched —
   essential because the lazy windows overlap and a single playback mixes
   segments from several. (An earlier nominal `keyframes.Get(seg)` rewrite
   overlapped by ~1 frame on B-frame content; anchoring the shift on the
   window's seek keyframe instead preserves the muxer's exact intra-window
   timing.)

### The clean-exit race (the subtle one — fixed in `run()`)

mp4ff makes `finalizeSegment` meaningfully slower than the old MPEG-TS path
(decode + re-encode vs. nothing), which exposed a latent race. The `cmd.Wait`
goroutine marks a head `DeletedHead` on **every** ffmpeg exit — including a
clean one — and the scanner drops any segment whose head is `DeletedHead` (to
discard the SIGINT-truncated tail segment a reaper kill leaves behind). For a
short window (e.g. seeking to the last few segments) ffmpeg exits almost
immediately, so the clean-exit `DeletedHead` landed *while the scanner was still
finalizing the last segment* — and that complete segment got dropped → the
client 500s after the 60 s wait. Mid-file windows hid it (ffmpeg keeps running
for ~100 segments), and the old MPEG-TS path hid it (instant finalize won the
race).

The fix: the `cmd.Wait` goroutine waits for the scanner to drain the
segment-list pipe (`scannerDone`) before marking the head deleted, so a clean
exit can never race the scanner. A reaper kill (`KillHead`) still sets
`DeletedHead` immediately, so genuinely truncated tail segments are still
dropped. This — not anything fMP4-specific — was the real cause of the
seek-storm failures.
4. `GetIndex` — `#EXT-X-VERSION:7`, add `#EXT-X-MAP:URI="init.mp4"`, list
   `segment-N.mp4`.
5. Routes / `streams.go` — the `init.mp4` request is handled by the existing
   `:chunk` route (detected by name), wired to `GetVideoInit`/`GetAudioInit`;
   `parseSegment` reads `segment-%d.mp4`; init and segments are served as
   `video/mp4`.

**mp4 parsing** (`src/mp4.go`) uses [`github.com/Eyevinn/mp4ff`](https://github.com/Eyevinn/mp4ff),
a maintained fMP4/CMAF library: `initTimescale` reads `moov.trak.mdia.mdhd`
and `rebaseFragment` decodes the `moof+mdat`, rewrites the `tfdt`
`BaseMediaDecodeTime`, and re-encodes. The timescale must come from the produced
init, not from `MediaInfo`/source ffprobe: the *output* mp4 timescale is chosen
by the muxer/encoder (framerate-derived for video, sample-rate for audio) and is
not reliably the source `time_base`, especially for transcodes.

**Extension caveat:** the segment muxer refuses a `.m4s` output filename
("Error opening output file … Invalid argument") even with `-segment_format
mp4` set explicitly. Segments are therefore written and served as `.mp4` (a
valid, common extension for HLS fMP4 media segments). The init file is
`init-<quality>.mp4` on disk, served at the `init.mp4` URL.

### Still to validate

- **Hardware-accel path** (QSV / VAAPI / CUDA): software x264 gave a stable,
  identical init across invocations; HW encoders should behave the same since
  params are fixed, but confirm on real hardware.

Core logic is covered by `src/mp4_test.go` (two independent lazy windows, asserts
the init is byte-identical across them, and that a rebased window-B segment reads
~0 unpatched but its correct absolute PTS after `rebaseFragment`). End-to-end
validated against a running transcoder with the `tests/hls_validation` suite
(12/12 passing): continuity, ABR switches, seeks, concurrent clients, and audio
boundaries.
