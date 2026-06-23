package src

import (
	"fmt"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

// These tests exercise the fMP4 box helpers against segments produced by the
// real ffmpeg segment muxer, mirroring the production pipeline:
//   1. produce self-contained fragmented mp4 segments (ftyp+moov+sidx+moof+mdat+mfra)
//   2. extract a shared init (ftyp+moov)
//   3. strip a segment to moof+mdat and patch its tfdt to an absolute decode time
//   4. concatenate init+segment and confirm ffprobe reads the patched timestamp
//
// They are skipped when ffmpeg/ffprobe are unavailable.

func requireFfmpeg(t *testing.T) {
	t.Helper()
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		t.Skip("ffmpeg not available")
	}
	if _, err := exec.LookPath("ffprobe"); err != nil {
		t.Skip("ffprobe not available")
	}
}

// makeFmp4Segments writes 2s fMP4 segments of a generated 20s clip and returns the dir.
func makeFmp4Segments(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	src := filepath.Join(dir, "src.mp4")
	gen := exec.Command("ffmpeg", "-y", "-loglevel", "error",
		"-f", "lavfi", "-i", "testsrc=duration=20:size=320x240:rate=24",
		"-c:v", "libx264", "-g", "48", "-keyint_min", "48", "-sc_threshold", "0",
		"-pix_fmt", "yuv420p", src)
	if out, err := gen.CombinedOutput(); err != nil {
		t.Skipf("could not generate test clip (ffmpeg lavfi unavailable?): %v\n%s", err, out)
	}
	seg := exec.Command("ffmpeg", "-y", "-loglevel", "error", "-copyts", "-i", src,
		"-an", "-c:v", "copy",
		"-f", "segment", "-segment_time", "2", "-segment_format", "mp4",
		"-segment_format_options", "movflags=frag_keyframe+empty_moov+default_base_moof",
		filepath.Join(dir, "seg_%d.mp4"))
	if out, err := seg.CombinedOutput(); err != nil {
		t.Fatalf("segmenting failed: %v\n%s", err, out)
	}
	return dir
}

func probeFirstPts(t *testing.T, file string) float64 {
	t.Helper()
	out, err := exec.Command("ffprobe", "-loglevel", "error",
		"-select_streams", "v", "-show_entries", "frame=pts_time",
		"-read_intervals", "%+#1", "-of", "csv=p=0", file).Output()
	if err != nil {
		t.Fatalf("ffprobe failed on %s: %v", file, err)
	}
	var pts float64
	if _, err := fmt.Sscanf(strings.TrimSpace(string(out)), "%f", &pts); err != nil {
		t.Fatalf("could not parse pts from %q: %v", out, err)
	}
	return pts
}

func TestFmp4InitAndSegmentPipeline(t *testing.T) {
	requireFfmpeg(t)
	dir := makeFmp4Segments(t)

	seg0 := filepath.Join(dir, "seg_0.mp4")
	seg5 := filepath.Join(dir, "seg_5.mp4") // ~10s into the clip
	for _, f := range []string{seg0, seg5} {
		if _, err := os.Stat(f); err != nil {
			t.Fatalf("expected segment %s missing: %v", f, err)
		}
	}

	raw0, err := os.ReadFile(seg0)
	if err != nil {
		t.Fatal(err)
	}
	raw5, err := os.ReadFile(seg5)
	if err != nil {
		t.Fatal(err)
	}

	// init is identical regardless of which segment it comes from.
	init0, err := extractInitSegment(raw0)
	if err != nil {
		t.Fatalf("extractInitSegment(seg0): %v", err)
	}
	init5, err := extractInitSegment(raw5)
	if err != nil {
		t.Fatalf("extractInitSegment(seg5): %v", err)
	}
	if string(init0) != string(init5) {
		t.Fatalf("init segments differ between segment 0 and segment 5 (len %d vs %d)", len(init0), len(init5))
	}

	timescale, err := readMediaTimescale(raw0)
	if err != nil {
		t.Fatalf("readMediaTimescale: %v", err)
	}
	if timescale == 0 {
		t.Fatal("timescale is 0")
	}

	// segment 5 covers t=10s. Patch its tfdt to 10*timescale and confirm playback PTS.
	const startTime = 10.0
	frags, err := stripToFragments(raw5)
	if err != nil {
		t.Fatalf("stripToFragments: %v", err)
	}
	if _, ok := findBox(frags, 0, len(frags), "moov"); ok {
		t.Fatal("stripped fragment still contains a moov box")
	}
	decodeTime := uint64(math.Round(startTime * float64(timescale)))
	if err := patchBaseMediaDecodeTime(frags, decodeTime); err != nil {
		t.Fatalf("patchBaseMediaDecodeTime: %v", err)
	}

	// init + patched segment must present a PTS at ~10s (continuous timeline),
	// not the muxer-rebased ~0s.
	combined := filepath.Join(dir, "combined.mp4")
	if err := os.WriteFile(combined, append(append([]byte{}, init0...), frags...), 0o644); err != nil {
		t.Fatal(err)
	}
	pts := probeFirstPts(t, combined)
	if math.Abs(pts-startTime) > 0.2 {
		t.Fatalf("patched segment PTS = %.4f, want ~%.1f", pts, startTime)
	}

	// control: an unpatched stripped segment should read ~0s.
	fragsRaw, _ := stripToFragments(raw5)
	combinedRaw := filepath.Join(dir, "combined_raw.mp4")
	if err := os.WriteFile(combinedRaw, append(append([]byte{}, init0...), fragsRaw...), 0o644); err != nil {
		t.Fatal(err)
	}
	if ptsRaw := probeFirstPts(t, combinedRaw); ptsRaw > 1.0 {
		t.Fatalf("control unpatched PTS = %.4f, expected ~0 (rebased)", ptsRaw)
	}
}
