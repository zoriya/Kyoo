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

// These tests exercise the fMP4 tfdt-patch path against segments produced by the
// real ffmpeg segment muxer, mirroring the production pipeline:
//   1. produce a shared init (ftyp+moov) via -segment_header_filename and clean
//      moof+mdat media segments (skip_trailer)
//   2. patch a segment's tfdt to an absolute decode time
//   3. concatenate init+segment and confirm ffprobe reads the patched timestamp
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

// makeSource generates a 40s test clip with keyframes every 2s.
func makeSource(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	src := filepath.Join(dir, "src.mp4")
	gen := exec.Command("ffmpeg", "-y", "-loglevel", "error",
		"-f", "lavfi", "-i", "testsrc=duration=40:size=320x240:rate=24",
		"-c:v", "libx264", "-g", "48", "-keyint_min", "48", "-sc_threshold", "0",
		"-pix_fmt", "yuv420p", src)
	if out, err := gen.CombinedOutput(); err != nil {
		t.Skipf("could not generate test clip (ffmpeg lavfi unavailable?): %v\n%s", err, out)
	}
	return src
}

// segmentWindow runs one lazy window: a -ss seek + start number, producing a
// shared init and clean fMP4 segments, exactly like Stream.run(). Returns
// (dir, initPath).
func segmentWindow(t *testing.T, src string, ssSeconds float64, startNumber int) (string, string) {
	t.Helper()
	dir := t.TempDir()
	initPath := filepath.Join(dir, "init.mp4")
	args := []string{"-y", "-loglevel", "error"}
	if ssSeconds > 0 {
		args = append(args, "-noaccurate_seek", "-ss", fmt.Sprintf("%f", ssSeconds))
	}
	args = append(args, "-copyts", "-i", src, "-an", "-c:v", "copy",
		"-f", "segment", "-segment_time", "2", "-segment_format", "mp4",
		"-segment_header_filename", initPath,
		"-segment_format_options", "movflags=frag_keyframe+empty_moov+default_base_moof+skip_trailer",
		"-segment_start_number", fmt.Sprint(startNumber),
		filepath.Join(dir, "seg_%d.mp4"))
	if out, err := exec.Command("ffmpeg", args...).CombinedOutput(); err != nil {
		t.Fatalf("segmenting (ss=%.1f) failed: %v\n%s", ssSeconds, err, out)
	}
	return dir, initPath
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
	src := makeSource(t)

	// Two independent lazy windows: window A from t=0, window B from t=20s
	// (segment 10, keyframes every 2s).
	dirA, initA := segmentWindow(t, src, 0, 0)
	dirB, initB := segmentWindow(t, src, 20, 10)

	initBytes, err := os.ReadFile(initA)
	if err != nil {
		t.Fatalf("reading init: %v", err)
	}
	// init must be a clean ftyp+moov (no media boxes).
	if _, ok := findBox(initBytes, 0, len(initBytes), "moov"); !ok {
		t.Fatal("init segment has no moov box")
	}
	if _, ok := findBox(initBytes, 0, len(initBytes), "moof"); ok {
		t.Fatal("init segment unexpectedly contains a moof box")
	}
	// the two independent windows must produce a byte-identical init.
	if otherInit, err := os.ReadFile(initB); err != nil {
		t.Fatalf("reading window B init: %v", err)
	} else if string(initBytes) != string(otherInit) {
		t.Fatalf("init segments differ across windows (len %d vs %d)", len(initBytes), len(otherInit))
	}

	timescale, err := readMediaTimescale(initBytes)
	if err != nil {
		t.Fatalf("readMediaTimescale: %v", err)
	}
	if timescale == 0 {
		t.Fatal("timescale is 0")
	}

	// Window B's segment 10 covers absolute t=20s, but the muxer rebased window B
	// to start at 0, so unpatched it reads ~0s with the shared init. This is the
	// crux of the lazy-window problem.
	seg := filepath.Join(dirB, "seg_10.mp4")
	raw, err := os.ReadFile(seg)
	if err != nil {
		t.Fatalf("reading seg: %v", err)
	}
	// segments must be clean moof+mdat (no moov to strip).
	if _, ok := findBox(raw, 0, len(raw), "moov"); ok {
		t.Fatal("media segment unexpectedly contains a moov box")
	}
	if _, ok := findBox(raw, 0, len(raw), "moof"); !ok {
		t.Fatal("media segment has no moof box")
	}

	combinedRaw := filepath.Join(dirB, "combined_raw.mp4")
	if err := os.WriteFile(combinedRaw, append(append([]byte{}, initBytes...), raw...), 0o644); err != nil {
		t.Fatal(err)
	}
	if ptsRaw := probeFirstPts(t, combinedRaw); ptsRaw > 1.0 {
		t.Fatalf("unpatched window-B segment PTS = %.4f, expected ~0 (rebased to window start)", ptsRaw)
	}

	// Patching tfdt to the absolute decode time (segment 10 -> 20s) restores the
	// continuous timeline, exactly like Stream.finalizeSegment.
	const absStart = 20.0
	patched := append([]byte{}, raw...)
	decodeTime := uint64(math.Round(absStart * float64(timescale)))
	if err := patchBaseMediaDecodeTime(patched, decodeTime); err != nil {
		t.Fatalf("patchBaseMediaDecodeTime: %v", err)
	}
	combined := filepath.Join(dirB, "combined.mp4")
	if err := os.WriteFile(combined, append(append([]byte{}, initBytes...), patched...), 0o644); err != nil {
		t.Fatal(err)
	}
	if pts := probeFirstPts(t, combined); math.Abs(pts-absStart) > 0.2 {
		t.Fatalf("patched segment PTS = %.4f, want ~%.1f", pts, absStart)
	}

	_ = dirA
}
