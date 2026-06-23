package src

import (
	"bytes"
	"fmt"

	"github.com/Eyevinn/mp4ff/mp4"
)

// fMP4 helpers for the segment pipeline, backed by github.com/Eyevinn/mp4ff.
//
// The segment muxer (-f segment -segment_format mp4 -segment_header_filename …
// -segment_format_options movflags=…+skip_trailer) writes the shared init
// segment (ftyp+moov) to its own file and emits each media segment as a clean
// moof+mdat fragment. It rebases every lazy window's tfdt to the window start;
// rebaseFragment shifts it back onto the absolute timeline. See
// docs/FMP4_MIGRATION.md.

// initTimescale reads the media (mdhd) timescale from an fMP4 init segment. This
// is the unit baseMediaDecodeTime is expressed in.
func initTimescale(init []byte) (uint32, error) {
	f, err := mp4.DecodeFile(bytes.NewReader(init))
	if err != nil {
		return 0, fmt.Errorf("decode init segment: %w", err)
	}
	if f.Init == nil || f.Init.Moov == nil || f.Init.Moov.Trak == nil {
		return 0, fmt.Errorf("init segment has no moov/trak")
	}
	return f.Init.Moov.Trak.Mdia.Mdhd.Timescale, nil
}

// rebaseFragment decodes a clean moof+mdat segment, recomputes its tfdt
// baseMediaDecodeTime via newBase (which receives the muxer's original,
// window-relative value), and returns the re-encoded segment. newBase is called
// once, with the first fragment's decode time.
func rebaseFragment(segment []byte, newBase func(orig uint64) uint64) ([]byte, error) {
	f, err := mp4.DecodeFile(bytes.NewReader(segment))
	if err != nil {
		return nil, fmt.Errorf("decode segment: %w", err)
	}
	if len(f.Segments) == 0 || len(f.Segments[0].Fragments) == 0 {
		return nil, fmt.Errorf("segment has no media fragment")
	}
	tfdt := f.Segments[0].Fragments[0].Moof.Traf.Tfdt
	if tfdt == nil {
		return nil, fmt.Errorf("fragment has no tfdt box")
	}
	tfdt.SetBaseMediaDecodeTime(newBase(tfdt.BaseMediaDecodeTime()))

	var out bytes.Buffer
	out.Grow(len(segment))
	if err := f.Encode(&out); err != nil {
		return nil, fmt.Errorf("re-encode segment: %w", err)
	}
	return out.Bytes(), nil
}
