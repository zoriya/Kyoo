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

## Approach B — `-f segment -segment_format mp4` + a separately-generated init

Keep the **exact** segmenting machinery we use today (`-f segment`,
`-segment_times`, `-segment_start_number`, `-segment_list pipe:1`, `-copyts`) and
only change the per-segment container:

```
-f segment -segment_format mp4 \
-segment_format_options movflags=frag_keyframe+empty_moov+default_base_moof
```

This makes each segment a self-contained fragmented MP4:
`ftyp + moov + sidx + moof + mdat + mfra`.

### What we found

- **The `moov` is byte-identical across independent ffmpeg invocations**, for
  every stream type we tested:
  - copy video — md5 `4f190f81`
  - transcoded x264 video — md5 `54e84930`
  - copy audio — md5 `c4cab1d4`

  So a single shared init is valid for the entire stream, including across lazy
  windows. (The original notes worried transcoded params might differ between
  windows; with fixed encoder settings they do not.)

- **No `edts`/`elst` is ever written.** The segment muxer with `empty_moov` does
  not emit an edit list at all. This is the single biggest advantage over
  Approach A: there is no window-specific offset that can poison the init, so the
  "which init does this segment belong to" problem simply does not exist.

- **`tfdt` is rebased to 0 in every segment** (regardless of `-copyts`,
  `default_base_moof`, or `dash` flags — the segment muxer creates a fresh muxer
  context per file). This must be patched, exactly like Approach A.

- **Init generation is free and unambiguous.** Extracting `ftyp + moov` from the
  first produced segment yields a `moov` byte-identical (md5 `496f820d`) to one
  produced by a dedicated init-only ffmpeg run (`-t 0.001 -f mp4 -movflags
  frag_keyframe+empty_moov+default_base_moof`). We can therefore generate the
  init by copying the head of the first segment we produce — no extra process.

- **Proven end-to-end:** a 16-segment playlist whose segment 15 came from a
  *separate* ffmpeg process — init extracted once, each segment stripped to
  `moof + mdat` and `tfdt` patched — decoded as 768/768 frames, monotonic PTS
  across the 29.96 s → 30.0 s window boundary, zero decode errors, HLS demuxer
  reporting the correct 32 s duration.

### Per-segment processing required

For each segment we serve (done once, when the segment becomes ready):

1. **Strip** `ftyp` / `moov` / `sidx` / `mfra`, keeping only `moof + mdat`.
2. **Patch** the `tfdt` `baseMediaDecodeTime` to the absolute decode time
   `round(keyframes.Get(segment) * timescale)`, where `timescale` is read once
   from the init's `mdhd` (video and audio each have their own init/timescale).

Both are cheap byte operations on ~16 KB files. `tfdt` is a single integer
overwrite; sample durations/offsets in `trun` are untouched, so the patch cannot
desync the media.

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
| Per-segment work | patch `tfdt` | strip boxes + patch `tfdt` | none (but per-window init + routing) |
| `tfdt` rebased per window | yes (patch) | yes (patch) | yes (`frag_discont`) |
| Playlist changes | `EXT-X-MAP` once | `EXT-X-MAP` once | `EXT-X-MAP` per window |
| End-to-end validated here | yes | yes | n/a |

## Recommendation

**Approach B.** It is the only option that keeps the lazy-window cutting and
ready-detection machinery exactly as-is, yields an elst-free init that is shared
across every window for free, and was validated end-to-end across a real window
boundary. The required per-segment box-strip + `tfdt` patch is small,
deterministic, and done once per segment.

### Implementation (Approach B, as built)

1. `stream.go::run()` — swap `-segment_format mpegts` → `mp4` with
   `-segment_format_options movflags=frag_keyframe+empty_moov+default_base_moof`.
   Keep `-segment_times`, `-segment_start_number`, `-segment_list pipe:1`,
   `-copyts` untouched.
2. **Init** (`Stream.GetInit`, `src/mp4.go::extractInitSegment`): generated
   on demand by a short dedicated ffmpeg run (`-t 0.5 -movflags
   frag_keyframe+empty_moov+default_base_moof -f mp4`) reusing the stream's
   transcode args, then keeping only `ftyp+moov`. Decoupled from the lazy
   windows because the player fetches `#EXT-X-MAP` before any media segment.
   The dedicated-run moov is byte-identical to the segments' moov (verified for
   copy video, transcoded video, and copy audio).
3. **Segment post-processing** (`Stream.finalizeSegment`, run in the
   segment-ready goroutine, outside the heads lock — the file is unique per
   `(encoder, segment)`): strip to `moof+mdat` and patch
   `tfdt = round(keyframes.Get(seg) * timescale)`, with `timescale` read from
   the segment's own `mdhd`.
4. `GetIndex` — `#EXT-X-VERSION:7`, add `#EXT-X-MAP:URI="init.mp4"`, list
   `segment-N.mp4`.
5. Routes / `streams.go` — the `init.mp4` request is handled by the existing
   `:chunk` route (detected by name), wired to `GetVideoInit`/`GetAudioInit`;
   `parseSegment` reads `segment-%d.mp4`; init and segments are served as
   `video/mp4`.

**Extension caveat:** the segment muxer refuses a `.m4s` output filename
("Error opening output file … Invalid argument") even with `-segment_format
mp4` set explicitly. Segments are therefore written and served as `.mp4` (a
valid, common extension for HLS fMP4 media segments). The init file is
`init-<quality>.mp4` on disk, served at the `init.mp4` URL.

### Still to validate

- **Hardware-accel path** (QSV / VAAPI / CUDA): software x264 gave a stable,
  identical init across invocations and the dedicated init run matches; HW
  encoders should behave the same since params are fixed, but confirm on real
  hardware.
- **Audio boundary precision**: `tfdt` is patched to the *nominal* segment start
  (`keyframes.Get(seg)`). For video this is exact (cuts are on keyframes); for
  audio the first sample may sit a fraction of a frame off the boundary, the
  same approximation the old MPEG-TS path made. Watch for boundary jitter in the
  `test_audio_*` integration tests.

Core logic is covered by `src/mp4_test.go` (generates real fMP4 segments,
extracts the shared init, strips + patches `tfdt`, and confirms via ffprobe the
patched segment reads its absolute PTS while the unpatched control reads ~0).
All exploration findings were reproduced from throwaway scripts (test asset:
60 s clip, keyframes every 2 s; lazy windows simulated as two independent ffmpeg
processes at t=0 and t=28 s).
