# fMP4 Migration: Known Issues and Investigation Notes

## Problem Statement

When switching the Kyoo transcoder from MPEG-TS (.ts) to fMP4 (.m4s) using `ffmpeg -f hls -hls_segment_type fmp4`, a fundamental incompatibility emerges between the "lazy window" transcode architecture and how ffmpeg's fMP4 HLS muxer handles timestamps.

The core issue: **each new encoder run (lazy window) produces fMP4 segments that are only compatible with that specific window's init file**, but the HLS protocol requires a single, stable init file URL per stream.

## How fMP4 + HLS Works in ffmpeg

### fMP4 File Structure
An fMP4 stream consists of:
1. **Init segment** (`init.m4s`): Contains `ftyp`, `moov` (with `trak`, `edts`/`elst`, `stbl`, etc.), and `mvex` boxes. This is referenced by `#EXT-X-MAP` in the playlist.
2. **Media segments** (`segment-N.m4s`): Each contains a `moof` box (with `traf`, `tfdt`, `trun`) followed by an `mdat` box containing the actual media packets.

### The `tfdt` Box
The `tfdt` (Track Fragment Decode Time) box inside each segment's `moof` specifies the base decode timestamp for that fragment. For continuous playback, `tfdt` must increase monotonically across segments.

### The `edts`/`elst` Edit List
The `edts` (Edit Box) containing `elst` (Edit List) in the init file tells the player how to map the timeline. When output timestamps don't start at 0, ffmpeg writes an edit list entry like:
```
elst entry 0: duration=400000, time=-1   # empty edit: skip 400s
elst entry 1: duration=0, time=0         # actual content starts at 0
```
This causes players to offset the displayed timeline.

## Root Cause

### ffmpeg's Per-Window State

When ffmpeg starts a new encoder for a lazy window (e.g., starting at segment 100, ~400s into the file), it writes:

1. **Init file**: Contains an `elst` edit list that reflects the window's start offset. For a window starting at 400s, the `elst` contains a 400s empty edit.
2. **Segment `tfdt`**: The first segment of each window has `tfdt=0` (relative to that window), not `tfdt=400000000` (absolute).
3. **Packet timestamps**: The actual media packets inside `mdat` have absolute timestamps (e.g., 400.02s, 400.04s...).

### The Incompatibility

Our architecture:
- All segments from all windows share the **same init file URL** (e.g., `segment-a0-original-0--1.m4s`)
- The server overwrites this init file when a new encoder starts
- HLS clients (and our tests) cache the init file
- When a later window overwrites the init file, clients still use the cached version

**Result**: Segments from window 1 are probed/played with window 0's init file, or vice versa. The mismatched `elst` causes timestamps to be computed incorrectly.

### Evidence

Probing actual cache files (encoder 0 = first window, encoder 1 = second window):
```
enc0 init + enc0 seg100: pts_times: [791.9135, 791.934833, 791.956167]  ← correct
enc0 init + enc1 seg100: pts_times: [399.9145, 399.935833, 399.957167]  ← WRONG
```

When the test fetches segment 100 via HTTP, it gets `enc0 init` (cached) + `enc1 seg100` (actual file), producing `~4.01s` instead of `~800s`.

## Why This Affects Both Audio and Video

### Copied Audio
- Uses output `-ss 391.893` and `-output_ts_offset 391.893`
- The offset triggers `elst` creation in the init file
- `tfdt` in segments starts at 0 for each window

### Transcoded Audio
- Uses input `-ss 391.893` and no `-output_ts_offset`
- Segment packet timestamps are window-relative (~4s for first segment)
- `tfdt` is also relative to the window
- No `elst` edit list, but the mismatch still occurs because different windows have different packet timestamp bases

### Transcoded Video
- Uses input `-ss` (or output `-ss` for copy)
- Also creates `elst` with empty edit when starting from non-zero position
- `test_continuity.py` only tests 14 segments (within a single window), so it passes
- If extended to cross window boundaries, it would fail identically

## Attempted Fixes and Why They Failed

### Fix 1: Regenerate Init File Per Window

**Attempt**: Add `os.Remove(initPath)` before each encoder run so ffmpeg always creates a fresh init file.

**Result**: FAILED

**Why**: The test's `ByteCache` (and real HLS clients) caches the init file by URL. Even though the disk file is fresh, the cached copy is stale. When a client fetches a segment from window 1, it uses the cached init from window 0, producing wrong timestamps.

**Verification**: Probing `enc1 seg100` with `enc0 init` (stale cache) gives `~4.01s` instead of `~800s`.

### Fix 2: Per-Window Init Files + Dynamic #EXT-X-MAP

**Concept**: Give each window its own init file (e.g., `init-0.m4s`, `init-100.m4s`) and emit `#EXT-X-MAP` tags before each window in the playlist.

**Status**: NOT ATTEMPTED

**Why deferred**: Requires changes to `GetIndex`, route parsing, and the test utilities. While spec-compliant, it complicates the segment lifecycle and doesn't solve the fundamental issue cleanly.

### Fix 3: Post-Processing Files

**Concept**: After each encoder run, rewrite the init file to strip `edts`/`elst` and rewrite segment `tfdt` to absolute values.

**Status**: NOT ATTEMPTED

**Why deferred**: Adds significant file post-processing overhead and complexity. The user explicitly stated this is "overly complex."

### Fix 4: Using `-output_ts_offset` for Copied Audio

**Attempt**: For copied audio, use `-output_ts_offset 400` to make packet timestamps absolute.

**Result**: PARTIALLY WORKS for single window, FAILS across windows

**Why**: With `-output_ts_offset`, packet timestamps become absolute (e.g., 400.02s). But ffmpeg still writes an `elst` in the init file. When the init file is cached and later overwritten by a new window, the mismatch persists.

**Evidence**: 
- With `-output_ts_offset 400` and `elst`: `pts_times: [400.02, 400.0415, 400.062833]`
- Without `elst` (hypothetical): `pts_times: [400.02, 400.0415, 400.062833]` (same, because packet timestamps are already absolute)

## Potential Solutions (Not Yet Tested)

### Solution A: `-use_editlist 0` ❌ TESTED - DOES NOT WORK

ffmpeg's mov/mp4 muxer has a `use_editlist` option (`ffmpeg -h muxer=mp4` confirms it). Setting `-use_editlist 0` or `-movflags -use_editlist` should prevent the `edts`/`elst` box.

**Tested placements**:
1. `-use_editlist 0` before `-f hls` → init still has `edts`
2. `-use_editlist 0` after `-f hls` → init still has `edts`
3. `-movflags -use_editlist` before `-f hls` → init still has `edts`
4. `-hls_segment_options movflags=-use_editlist` → **ffmpeg errors**: `Undefined constant or missing '(' in 'use_editlist'` because `use_editlist` is a separate muxer option, not a `movflags` value

**Conclusion**: The mov muxer options do not propagate through the HLS muxer to the segment files. The HLS muxer creates its own internal mov muxer instances for segments, and `-use_editlist` is not forwarded to them.

### Solution B: `-hls_segment_options movflags=frag_custom+dash+delay_moov+frag_discont` ❌ TESTED - DOES NOT WORK

Referenced in [nightfall](https://github.com/Dusk-Labs/nightfall/blob/master/src/profiles/video.rs), which uses fMP4 HLS with lazy windows.

They use:
```
-hls_segment_options movflags=frag_custom+dash+delay_moov+frag_discont
```

**Test results**:
```bash
ffmpeg ... -hls_segment_options movflags=frag_custom+dash+delay_moov \
  -hls_segment_type fmp4 -hls_fmp4_init_filename init0.m4s ...

# Cross-probe results:
init0 + seg0-99  → pts: [396.0105, 396.031, 396.052]   ← correct
init1 + seg1-99  → pts: [391.893, 391.914, 391.935]     ← correct
init0 + seg1-99  → pts: [0.0, 0.021, 0.042]             ← WRONG
init1 + seg0-99  → pts: [787.9, 787.9, 787.9]           ← WRONG
```

**Conclusion**: Even with nightfall's movflags, cross-window init file reuse produces broken timestamps. The `frag_discont` flag changes how `tfdt` is written but does not make segments compatible across different init files.

**Important note**: nightfall does NOT solve this with flags alone. They use **per-window init files** (`{}_init.mp4`), which is exactly "Solution A" above. Their comment in the code confirms this:
> "args needed so we can distinguish between init fragments for new streams. Basically on the web seeking works by reloading the entire video because of discontinuity issues that browsers seem to not ignore like mpv."

### Solution C: `-start_at_zero` for Transcoded Streams - NOT TESTED

Re-add `-start_at_zero` for transcoded audio/video. This flag makes ffmpeg subtract the `-ss` offset from output timestamps.

**Why it might work**:
- Output timestamps start at 0 regardless of `-ss`
- No `elst` needed because timestamps are already 0-based
- Similar to how we handled MPEG-TS

**Concerns**:
- For audio, `-start_at_zero` with `-ss` before `-i` created gaps (this was the original reason we removed it)
- For video with `-c:v copy`, it might not work correctly
- Would need extensive testing across all stream types

### Solution D: `-initial_timestamp` or `-muxpreload` - NOT TESTED

Some ffmpeg options allow setting the initial timestamp for the output:
- `-initial_timestamp 400` might force `tfdt` to start at 400s
- `-muxpreload 0` might prevent timestamp rebasing

**Concerns**:
- These flags are container-specific and behavior with fMP4 HLS is undocumented
- Might not interact correctly with `-copyts`

### Solution E: Post-process init file to strip `edts`/`elst` - NOT TESTED

After ffmpeg writes the init file, remove the `edts`/`elst` box from it.

**Why it might work**:
- Without `elst`, all init files are functionally identical (only codec params differ)
- Packet timestamps are already correct (absolute with `-output_ts_offset` for copied audio, or window-relative for transcoded)
- A single init file would work for all windows

**Concerns**:
- For transcoded streams, packet timestamps ARE window-relative (e.g., 0s, 4s...), not absolute
- Without `elst`, a transcoded segment from window 1 would show 0s instead of 400s
- This would only work for copied streams with `-output_ts_offset`

### Solution F: Per-window init files with dynamic `#EXT-X-MAP` - NOT IMPLEMENTED

Give each lazy window its own init file (e.g., `init-0.m4s`, `init-100.m4s`).
The playlist emits a new `#EXT-X-MAP` tag before each window's segments.

**Why it works**:
- Each window's segments are only probed/played with that window's init file
- No timestamp computation mismatch
- Used successfully by [nightfall](https://github.com/Dusk-Labs/nightfall)

**Concerns**:
- Requires changes to `GetIndex` to emit `#EXT-X-MAP` per window
- Requires route parsing to serve different init files
- Requires test utilities to handle multiple init files
- HLS clients must handle `#EXT-X-MAP` appearing mid-playlist (most do, but need verification)
- The server must know which init file corresponds to which window when serving segments

## Reference: nightfall's Approach

The [nightfall](https://github.com/Dusk-Labs/nightfall) project (also Rust, also fMP4 HLS transcoder) handles this by:

1. **Per-window init files**: `init_seg = format!("{}_init.mp4", start_num)`
2. **Discontinuity flags for non-zero starts**:
   ```
   -hls_segment_options movflags=frag_custom+dash+delay_moov+frag_discont
   ```
3. **Web-side handling**: The web server returns the correct init file for each window

They explicitly note:
> "args needed so we can distinguish between init fragments for new streams. Basically on the web seeking works by reloading the entire video because of discontinuity issues that browsers seem to not ignore like mpv."

This confirms that the issue is inherent to ffmpeg's fMP4 muxer and not unique to our codebase.

## Current Status

- `stream.go` has been updated to use `-f hls -hls_segment_type fmp4`
- `.m4s` extensions are used for all segments
- Init file path is generated via `GetInitPath()`
- `os.Remove(initPath)` is called before each encoder run (but doesn't solve the caching issue)
- `test_fmp4.py` passes (basic fMP4 structure tests)
- `test_continuity.py` passes (only tests within a single window)
- `test_audio_segment_100_boundary_is_continuous` passes (checks gap/overlap at boundaries)
- `test_audio_pts_never_resets_across_lazy_windows` **FAILS** (the critical test)

## Recommended Next Steps

**Single-flag fixes tested and failed**:
- `-use_editlist 0` does not propagate through the HLS muxer
- Nightfall's `movflags=frag_custom+dash+delay_moov+frag_discont` does not solve cross-window compatibility

**Remaining options to investigate**:

1. **Test `-start_at_zero` for transcoded streams** (Solution C): Make all output timestamps 0-based so no `elst` is needed. This is how MPEG-TS worked, but it previously caused audio gaps.

2. **Test `-initial_timestamp`** (Solution D): Force absolute `tfdt` values in segments so they don't reset per window.

3. **Post-process init files** (Solution E): After each encoder run, strip the `edts`/`elst` box. This is simpler than full file rewriting but only works if packet timestamps are already absolute (which they are for copied audio with `-output_ts_offset`).

4. **Per-window init files** (Solution F): If no flag works, this is the only robust solution. It requires:
   - Changing `initPath()` to include the window number
   - Updating `GetIndex()` to emit `#EXT-X-MAP` before each window
   - Updating route handlers to serve different init files
   - This is the approach used by nightfall and is HLS-spec compliant

## Files Modified

- `transcoder/src/stream.go`: Core muxer switch, ffmpeg arg construction, playlist scanner, `os.Remove(initPath)`
- `transcoder/src/videostream.go`: `.m4s` extension, `-g 999999 -sc_threshold 0`
- `transcoder/src/audiostream.go`: `.m4s` extension
- `transcoder/src/api/streams.go`: `parseSegment` handles `-1.m4s` init files
- `transcoder/src/filestream.go`: Init-segment interception in `GetVideoSegment`/`GetAudioSegment`
- `transcoder/tests/hls_validation/test_fmp4.py`: fMP4 validation tests
